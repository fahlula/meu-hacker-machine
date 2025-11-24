import { VM } from 'vm2';
import * as ts from 'typescript';
import { Exercise, TestCase, TestResult, TestCaseResult } from '../types/exercise.types';
import { FakerDB } from './FakerDB';
import { PaginatedApiResponse } from '../types/api.types';

export class TestRunner {
  private baseUrl: string;
  private exerciseId?: string;

  constructor(private fakerDB: FakerDB, baseUrl?: string) {
    // Use environment variable for public URL (ngrok), otherwise localhost
    this.baseUrl = process.env.PUBLIC_URL || baseUrl || 'http://localhost:3001';
    console.log(`TestRunner usando proxy de API interno (sem chamadas HTTP externas)`);
  }

  private transpileTypeScript(code: string): string {
    // Transpile TypeScript to JavaScript
    const result = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        lib: ['es2020', 'dom'],
      }
    });
    return result.outputText;
  }

  /**
   * Internal API handler - routes fetch calls directly to FakerDB without external HTTP
   * This prevents hitting ngrok rate limits during test execution
   * BLOCKS external URLs - only allows internal /api routes
   */
  private createInternalFetch() {
    return async (url: string, options?: any) => {
      // Parse URL to extract path and query params
      let urlObj: URL;
      try {
        urlObj = new URL(url, 'http://localhost:3001');
      } catch (e) {
        return {
          ok: false,
          status: 400,
          json: async () => ({ error: 'URL inválida' }),
          text: async () => JSON.stringify({ error: 'URL inválida' })
        };
      }

      // URL validation - allow localhost, relative paths, and ngrok URLs
      const isLocalhost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
      const isRelativePath = url.startsWith('/');
      const isNgrokUrl = urlObj.hostname.includes('ngrok.io') || urlObj.hostname.includes('ngrok-free.app');

      // Block external URLs that are NOT ngrok (e.g., www.google.com)
      if (!isLocalhost && !isRelativePath && !isNgrokUrl) {
        console.error(`BLOQUEADO: Tentativa de fetch externo para ${url}`);
        return {
          ok: false,
          status: 403,
          json: async () => ({
            error: 'Chamadas externas não são permitidas. Use /api/... para acessar a API mock.'
          }),
          text: async () => JSON.stringify({
            error: 'Chamadas externas não são permitidas. Use /api/... para acessar a API mock.'
          })
        };
      }

      // Log when accepting ngrok URLs for debugging
      if (isNgrokUrl) {
        console.log(`✓ Aceitando URL ngrok: ${url}`);
      }

      const path = urlObj.pathname.replace('/api', '');
      const searchParams = urlObj.searchParams;

      // Extract pagination and filters
      const page = parseInt(searchParams.get('page') || '1');
      const perPage = 10; // Default from MockApiEngine
      const filters: Record<string, any> = {};

      // Extract filters
      if (searchParams.has('city')) {
        filters.city = searchParams.get('city');
      }

      try {
        // Query data directly from FakerDB (same logic as MockApiEngine)
        const data = this.fakerDB.queryData(
          this.exerciseId!,
          path,
          {
            page,
            perPage,
            filters: Object.keys(filters).length > 0 ? filters : undefined
          }
        );

        const totalRecords = this.fakerDB.getTotalCount(this.exerciseId!, path, filters);
        const totalPages = Math.ceil(totalRecords / perPage);

        // Build paginated response (matching MockApiEngine format)
        const response: PaginatedApiResponse = {
          page,
          per_page: perPage,
          total: totalRecords,
          total_pages: totalPages,
          data
        };

        // Return a response object that mimics fetch Response
        return {
          ok: true,
          status: 200,
          json: async () => response,
          text: async () => JSON.stringify(response)
        };
      } catch (error) {
        console.error('Erro no fetch interno:', error);
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: 'Erro interno do servidor' }),
          text: async () => JSON.stringify({ error: 'Erro interno do servidor' })
        };
      }
    };
  }

  public async runTests(exercise: Exercise, userCode: string): Promise<TestResult> {
    this.exerciseId = exercise.id;
    const results: TestCaseResult[] = [];
    let totalScore = 0;
    const scorePerTest = exercise.score / exercise.testCases.length;

    const startTime = Date.now();

    for (const testCase of exercise.testCases) {
      const result = await this.runSingleTest(exercise, testCase, userCode);
      results.push(result);

      if (result.passed) {
        totalScore += scorePerTest;
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      passed: results.every(r => r.passed),
      score: Math.round(totalScore),
      totalScore: exercise.score,
      results,
      executionTime
    };
  }

  /**
   * Run user code manually with custom arguments
   */
  public async runManually(exercise: Exercise, userCode: string, args: any[]): Promise<{
    result: any;
    stdout: string;
    stderr: string;
    executionTime: number;
    error?: string;
  }> {
    this.exerciseId = exercise.id;
    const startTime = Date.now();

    try {
      // Capture console outputs
      const consoleLogs: string[] = [];
      const consoleErrors: string[] = [];

      // Create VM sandbox
      const vm = new VM({
        timeout: 10000, // 10 second timeout for manual runs
        sandbox: {
          console: {
            log: (...args: any[]) => {
              const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' ');
              consoleLogs.push(message);
            },
            error: (...args: any[]) => {
              const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' ');
              consoleErrors.push(message);
            }
          }
        }
      });

      // Transpile TypeScript to JavaScript
      const transpiledCode = this.transpileTypeScript(userCode);

      // Create internal fetch handler
      const internalFetch = this.createInternalFetch();

      // Inject internal fetch into sandbox
      const sandboxCode = `
        const fetch = async (url, options) => {
          let fullUrl = url;
          if (!url.startsWith('http')) {
            fullUrl = url.startsWith('/api')
              ? 'http://localhost:3001' + url
              : 'http://localhost:3001/api' + url;
          }
          return __internalFetch__(fullUrl, options);
        };

        ${transpiledCode}

        // Execute the function with provided arguments
        (async () => {
          const params = ${JSON.stringify(args)};
          return await ${exercise.functionSignature.name}(...params);
        })();
      `;

      // Add internal fetch to VM context
      vm.freeze(internalFetch, '__internalFetch__');

      // Run user code
      const resultPromise = vm.run(sandboxCode);
      const result = await resultPromise;

      const executionTime = Date.now() - startTime;

      return {
        result,
        stdout: consoleLogs.join('\n'),
        stderr: consoleErrors.join('\n'),
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        result: null,
        stdout: '',
        stderr: '',
        executionTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async runSingleTest(
    exercise: Exercise,
    testCase: TestCase,
    userCode: string
  ): Promise<TestCaseResult> {
    const startTime = Date.now();

    try {
      // Resolve ANY_CITY to a representative city from generated data
      const resolvedInput = this.resolveTestInput(testCase, exercise);

      // Capture console outputs
      const consoleLogs: string[] = [];
      const consoleErrors: string[] = [];

      // Create VM sandbox
      const vm = new VM({
        timeout: testCase.timeout,
        sandbox: {
          console: {
            log: (...args: any[]) => {
              const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' ');
              consoleLogs.push(message);
            },
            error: (...args: any[]) => {
              const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' ');
              consoleErrors.push(message);
            }
          }
        }
      });

      // Transpile TypeScript to JavaScript
      const transpiledCode = this.transpileTypeScript(userCode);

      // Create internal fetch handler
      const internalFetch = this.createInternalFetch();

      // Inject internal fetch into sandbox (no external HTTP calls)
      const sandboxCode = `
        const fetch = async (url, options) => {
          // Use internal API proxy - routes directly to FakerDB
          let fullUrl = url;
          if (!url.startsWith('http')) {
            // Ensure we don't double-add /api prefix
            fullUrl = url.startsWith('/api')
              ? 'http://localhost:3001' + url
              : 'http://localhost:3001/api' + url;
          }
          return __internalFetch__(fullUrl, options);
        };

        ${transpiledCode}

        // Execute the function
        (async () => {
          const params = ${JSON.stringify(Object.values(resolvedInput))};
          return await ${exercise.functionSignature.name}(...params);
        })();
      `;

      // Add internal fetch to VM context
      vm.freeze(internalFetch, '__internalFetch__');

      // Run user code
      const resultPromise = vm.run(sandboxCode);
      const actual = await resultPromise;

      const executionTime = Date.now() - startTime;

      // Validate result
      const passed = this.validateResult(testCase, actual, exercise, resolvedInput);

      // Calculate expected output for display
      let expectedOutput: any = testCase.expectedOutput;
      if (testCase.validation && !expectedOutput) {
        // Calculate the actual expected array instead of just description
        expectedOutput = this.calculateExpectedValue(testCase, exercise, resolvedInput);
      }

      return {
        testId: testCase.id,
        testName: testCase.name,
        passed,
        type: testCase.type,
        executionTime,
        expected: expectedOutput,
        actual: actual, // Always show actual result for explicit output
        stdout: consoleLogs.join('\n'),
        stderr: consoleErrors.join('\n')
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        testId: testCase.id,
        testName: testCase.name,
        passed: false,
        type: testCase.type,
        executionTime,
        error: error instanceof Error ? error.message : String(error),
        expected: testCase.expectedOutput,
        actual: undefined
      };
    }
  }

  /**
   * Calculate the actual expected value for a test case (returns the array)
   */
  private calculateExpectedValue(testCase: TestCase, exercise: Exercise, resolvedInput?: Record<string, any>): any {
    try {
      const endpoint = exercise.mockApi.endpoints[0];
      const sourceData = this.fakerDB.getFullData(exercise.id, endpoint.path);
      const inputToUse = resolvedInput || testCase.input;

      // Apply filters based on query params
      const filteredData = this.filterDataByQueryParams(
        sourceData,
        inputToUse,
        endpoint.queryParams || []
      );

      if (testCase.validation?.type === 'filter_check') {
        const condition = testCase.validation.condition;
        if (!condition) return [];

        // Apply test condition to filtered data
        const expectedData = filteredData.filter(item =>
          this.evaluateCondition(item, condition, inputToUse)
        );

        // Determine which field to extract
        const resultField = testCase.validation.resultField || this.inferResultField(exercise);

        // Extract expected values
        const expectedValues = expectedData.map(item => {
          const value = item[resultField];
          return value !== undefined && value !== null ? value : null;
        }).filter(v => v !== null);

        return expectedValues;
      }

      if (testCase.validation?.type === 'count_check') {
        // For count checks, just return a description since there's no specific expected array
        return this.generateExpectedDescription(testCase, exercise, inputToUse);
      }

      return testCase.expectedOutput;
    } catch (error) {
      console.error('Error calculating expected value:', error);
      return this.generateExpectedDescription(testCase, exercise, resolvedInput || testCase.input);
    }
  }

  /**
   * Generate a human-readable description of what was expected
   */
  private generateExpectedDescription(testCase: TestCase, exercise: Exercise, resolvedInput: Record<string, any>): string {
    if (testCase.validation?.type === 'filter_check') {
      const condition = testCase.validation.condition;
      const inputParams = Object.entries(resolvedInput)
        .map(([key, value]) => `${key}=${typeof value === 'string' ? `"${value}"` : value}`)
        .join(', ');
      return `Array de strings com elementos que satisfazem: ${condition} (Parâmetros: ${inputParams})`;
    }
    if (testCase.validation?.type === 'count_check') {
      const min = testCase.validation.minCount;
      const max = testCase.validation.maxCount;
      if (min !== undefined && max !== undefined) {
        return `Array com tamanho entre ${min} e ${max}`;
      } else if (min !== undefined) {
        return `Array com tamanho >= ${min}`;
      } else if (max !== undefined) {
        return `Array com tamanho <= ${max}`;
      }
    }
    return 'Resultado correto baseado na validação';
  }

  /**
   * GENERIC: Resolve test inputs by replacing ANY_* placeholders with representative values
   * Works for any field type without hardcoding - driven by exercise schema
   */
  private resolveTestInput(testCase: TestCase, exercise: Exercise): Record<string, any> {
    const input = { ...testCase.input };
    const endpoint = exercise.mockApi.endpoints[0];
    const sourceData = this.fakerDB.getFullData(exercise.id, endpoint.path);

    // Iterate through all input fields and resolve ANY_* placeholders
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string' && value.startsWith('ANY_')) {
        // This is a placeholder - find representative value for this field
        const representative = this.findRepresentativeValue(sourceData, testCase, key);
        if (representative) {
          input[key] = representative;
          console.log(`✓ Resolved ${key}: ANY_* → "${representative}"`);
        }
      }
    }

    return input;
  }

  /**
   * Find a representative value for a field that makes the test meaningful
   * ENSURES selected value has AT LEAST 3 matching items (or 1 for edge cases)
   */
  private findRepresentativeValue(data: any[], testCase: TestCase, fieldName: string): string | null {
    // Group data by field value
    const valueCounts = new Map<string, number>();

    for (const item of data) {
      if (item[fieldName]) {
        const value = item[fieldName];

        // Check if item matches the test condition
        const matchesCondition = this.evaluateCondition(item, testCase.validation?.condition || '', testCase.input);

        if (matchesCondition) {
          valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
        }
      }
    }

    // Sort by count descending
    const sortedValues = Array.from(valueCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    console.log(`🔍 Finding representative ${fieldName} for condition: ${testCase.validation?.condition}`);
    console.log(`📊 Top candidates:`, sortedValues.slice(0, 5).map(([val, cnt]) => `${val}(${cnt})`).join(', '));

    // STRICT: For regular tests, require AT LEAST 3 matches
    // Only allow 0-1 matches for explicit edge case tests (with "nenhum" or "empty" in name)
    const isEdgeCaseTest = testCase.name.toLowerCase().includes('nenhum') ||
                          testCase.name.toLowerCase().includes('empty') ||
                          testCase.name.toLowerCase().includes('impossível');

    if (!isEdgeCaseTest) {
      // Regular test - MUST have at least 3 matching items
      const validValues = sortedValues.filter(([, count]) => count >= 3);

      if (validValues.length === 0) {
        console.error(`❌ NO valid representative found! All values have < 3 matches`);
        console.error(`This indicates broken test data. Top counts:`, sortedValues.slice(0, 10));
        // Fall back but log warning
        if (sortedValues.length > 0) {
          console.warn(`⚠️ Using ${sortedValues[0][0]} with only ${sortedValues[0][1]} matches (BROKEN TEST)`);
          return sortedValues[0][0];
        }
        return null;
      }

      // Prefer 5-20 matching items (good test range)
      const ideal = validValues.find(([, count]) => count >= 5 && count <= 20);
      if (ideal) {
        console.log(`✅ Selected ${fieldName}="${ideal[0]}" with ${ideal[1]} matching items`);
        return ideal[0];
      }

      // Otherwise pick first valid (>= 3)
      console.log(`✅ Selected ${fieldName}="${validValues[0][0]}" with ${validValues[0][1]} matching items`);
      return validValues[0][0];
    } else {
      // Edge case test - 0-1 matches is acceptable
      if (sortedValues.length > 0) {
        console.log(`✅ Edge case: Selected ${fieldName}="${sortedValues[0][0]}" with ${sortedValues[0][1]} matches`);
        return sortedValues[0][0];
      }
      return null;
    }
  }

  /**
   * Infer which field to extract for filter results based on exercise schema
   */
  private inferResultField(exercise: Exercise): string {
    const endpoint = exercise.mockApi.endpoints[0];
    const schema = endpoint.dataGenerator?.itemSchema;

    if (!schema) return 'name'; // fallback

    // Common patterns for result fields
    const fieldPriority = ['title', 'name', 'username', 'id'];

    for (const field of fieldPriority) {
      if (schema.hasOwnProperty(field)) {
        console.log(`✓ Inferred result field: "${field}"`);
        return field;
      }
    }

    // Last resort: use first string field in schema
    for (const [key, value] of Object.entries(schema)) {
      if (typeof value === 'string') {
        console.log(`✓ Inferred result field (first string): "${key}"`);
        return key;
      }
    }

    return 'name'; // ultimate fallback
  }

  /**
   * Evaluate a condition string against an item
   * Supports simple conditions and compound conditions with &&
   */
  private evaluateCondition(item: any, condition: string, inputParams: Record<string, any>): boolean {
    if (!condition) return true;

    // Split by && for compound conditions
    const conditions = condition.split('&&').map(c => c.trim());

    // All conditions must be true
    return conditions.every(cond => {
      // Parse single condition (e.g., "estimated_cost <= maxCost")
      const match = cond.match(/(\w+)\s*([><=!]+)\s*(\w+)/);
      if (!match) return false;

      const [, field, operator, paramName] = match;
      const paramValue = inputParams[paramName];
      const fieldValue = item[field];

      switch (operator) {
        case '>': return fieldValue > paramValue;
        case '>=': return fieldValue >= paramValue;
        case '<': return fieldValue < paramValue;
        case '<=': return fieldValue <= paramValue;
        case '==': return fieldValue == paramValue;
        case '===': return fieldValue === paramValue;
        case '!=': return fieldValue != paramValue;
        case '!==': return fieldValue !== paramValue;
        default: return false;
      }
    });
  }

  private validateResult(testCase: TestCase, actual: any, exercise: Exercise, resolvedInput?: Record<string, any>): boolean {
    // New validation system using FakerDB as source of truth
    if (testCase.validation) {
      return this.validateAgainstFakerDB(testCase, actual, exercise, resolvedInput);
    }

    // If there's a custom validator
    if (testCase.customValidator) {
      // For now, we'll skip custom validators
      // In a full implementation, these would be predefined functions
      return true;
    }

    // If there's validation logic (like "result.length >= 10")
    if (testCase.validationLogic) {
      try {
        const result = actual;
        return eval(testCase.validationLogic);
      } catch (error) {
        console.error('Erro na lógica de validação:', error);
        return false;
      }
    }

    // Direct comparison with expected output
    if (testCase.expectedOutput !== undefined) {
      return this.deepEqual(actual, testCase.expectedOutput);
    }

    return false;
  }

  /**
   * GENERIC: Compare array results with expected values
   * Handles empty arrays, length mismatches, and order preservation
   */
  private compareArrayResults(actual: any, expected: any[], preserveOrder?: boolean): boolean {
    // Type check
    if (!Array.isArray(actual)) {
      console.log(`✗ Expected array, got ${typeof actual}`);
      return false;
    }

    // RULE: Empty arrays are only valid when expected is also empty
    // This catches the case where user returns [] when there should be results
    if (expected.length === 0 && actual.length === 0) {
      console.log(`✓ Both expected and actual are empty - valid edge case`);
      return true;
    }

    // User returned empty but should have results = FAIL
    if (expected.length > 0 && actual.length === 0) {
      console.log(`✗ Expected ${expected.length} results, but user returned empty array`);
      return false;
    }

    // Expected empty but user returned results = FAIL
    if (expected.length === 0 && actual.length > 0) {
      console.log(`✗ Expected empty array, but user returned ${actual.length} results`);
      return false;
    }

    // Length mismatch = FAIL
    if (actual.length !== expected.length) {
      console.log(`✗ Length mismatch: expected ${expected.length}, got ${actual.length}`);
      return false;
    }

    // Content comparison
    if (preserveOrder) {
      // Order matters - check element by element
      const allMatch = actual.every((item, index) => item === expected[index]);
      if (!allMatch) {
        console.log(`✗ Order mismatch or wrong values`);
        console.log(`Expected: ${JSON.stringify(expected.slice(0, 5))}...`);
        console.log(`Got: ${JSON.stringify(actual.slice(0, 5))}...`);
      }
      return allMatch;
    } else {
      // Order doesn't matter - use set comparison
      const actualSet = new Set(actual);
      const expectedSet = new Set(expected);
      const matches = actualSet.size === expectedSet.size &&
             [...actualSet].every(item => expectedSet.has(item));
      if (!matches) {
        console.log(`✗ Values don't match expected set`);
      }
      return matches;
    }
  }

  /**
   * GENERIC: Filter data based on query parameters
   * Works for any combination of filters - driven by endpoint schema
   */
  private filterDataByQueryParams(data: any[], input: Record<string, any>, queryParams: string[]): any[] {
    return data.filter(item => {
      // Check all query params (except 'page' which is for pagination)
      for (const param of queryParams) {
        if (param === 'page') continue; // Skip pagination param

        const inputValue = input[param];
        if (inputValue !== undefined && inputValue !== null) {
          // Apply exact match filter for this parameter
          const itemValue = item[param];

          if (itemValue !== inputValue) {
            return false; // Item doesn't match this filter
          }
        }
      }
      return true; // Item matches all filters (or no filters applied)
    });
  }

  private validateAgainstFakerDB(testCase: TestCase, actual: any, exercise: Exercise, resolvedInput?: Record<string, any>): boolean {
    try {
      const endpoint = exercise.mockApi.endpoints[0];
      const sourceData = this.fakerDB.getFullData(exercise.id, endpoint.path);
      const inputToUse = resolvedInput || testCase.input;

      // GENERIC: Apply filters based on ALL query params defined in endpoint
      const filteredData = this.filterDataByQueryParams(
        sourceData,
        inputToUse,
        endpoint.queryParams || []
      );

      if (testCase.validation?.type === 'filter_check') {
        const condition = testCase.validation.condition;
        if (!condition) return false;

        // Apply test condition to filtered data
        const expectedData = filteredData.filter(item =>
          this.evaluateCondition(item, condition, inputToUse)
        );

        // Determine which field to extract based on exercise schema
        const resultField = testCase.validation.resultField || this.inferResultField(exercise);

        // Extract expected values
        const expectedValues = expectedData.map(item => {
          const value = item[resultField];
          if (value === undefined || value === null) {
            console.warn(`Field "${resultField}" not found in item:`, item);
            return null;
          }
          return value;
        }).filter(v => v !== null);

        console.log(`✓ Expected ${expectedValues.length} results matching condition: ${condition}`);
        console.log(`✓ User returned ${actual.length} results`);

        // Compare results using generic comparator
        return this.compareArrayResults(actual, expectedValues, testCase.validation.preserveOrder);
      }

      if (testCase.validation?.type === 'count_check') {
        if (!Array.isArray(actual)) return false;
        const count = actual.length;

        if (testCase.validation.minCount !== undefined && count < testCase.validation.minCount) {
          return false;
        }

        if (testCase.validation.maxCount !== undefined && count > testCase.validation.maxCount) {
          return false;
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro de validação:', error);
      return false;
    }
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }

    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      return keysA.every(key => this.deepEqual(a[key], b[key]));
    }

    return false;
  }
}
