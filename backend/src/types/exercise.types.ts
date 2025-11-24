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
  referenceCode: string;
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
  endpoints: EndpointConfig[];
}

export interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  paginated: boolean;
  queryParams?: string[];
  perPage?: number;
  totalRecords?: number;
  dataGenerator: DataGenerator;
  responseWrapper?: Record<string, any>;
}

export interface DataGenerator {
  type: 'array' | 'object';
  seed?: number;
  itemSchema?: Record<string, string>;
  staticRecords?: any[];
  cityBasedData?: Record<string, any[]>;
  totalRecords?: number;
}

export interface TestCase {
  id: string;
  name: string;
  type: 'visible' | 'hidden';
  input: Record<string, any>;
  expectedOutput?: any;
  validationLogic?: string;
  validation?: TestValidation;
  customValidator?: string;
  timeout: number;
}

export interface TestValidation {
  type: 'filter_check' | 'count_check' | 'custom';
  condition?: string;
  resultField?: string; // Field to extract from filtered results (e.g., 'title', 'name', 'username')
  preserveOrder?: boolean;
  minCount?: number;
  maxCount?: number;
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
