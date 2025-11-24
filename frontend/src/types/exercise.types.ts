export interface Exercise {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  category: string;
  timeLimit?: number;
  description: string;
  functionSignature: FunctionSignature;
  starterCode: string;
  mockApi: MockApiConfig;
  testCases: TestCase[];
  hints: string[];
  apiDocumentation?: ApiDocumentation;
}

export interface FunctionSignature {
  name: string;
  params: Array<{
    name: string;
    type: string;
  }>;
  returnType: string;
}

export interface MockApiConfig {
  originalUrl: string;
  proxyPath: string;
  endpoints: any[];
}

export interface TestCase {
  id: string;
  name: string;
  type: 'visible' | 'hidden';
  input: Record<string, any>;
  expectedOutput?: any;
  timeout: number;
}

export interface ApiDocumentation {
  baseUrl: string;
  endpoints: Array<{
    path: string;
    method: string;
    description: string;
    queryParams?: Array<{
      name: string;
      type: string;
      required: boolean;
      default?: any;
      description?: string;
    }>;
    responseExample?: string;
  }>;
}

export interface TestResult {
  passed: boolean;
  score: number;
  totalScore: number;
  results: TestCaseResult[];
  executionTime: number;
}

export interface TestCaseResult {
  testId: string;
  testName: string;
  passed: boolean;
  type: 'visible' | 'hidden';
  executionTime: number;
  error?: string;
  expected?: any;
  actual?: any;
  stdout?: string;
  stderr?: string;
}
