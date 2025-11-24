import { TestResult } from './exercise.types';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedApiResponse<T = any> {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: T[];
}

export interface SubmitCodeRequest {
  code: string;
  exerciseId: string;
}

export interface SubmitCodeResponse extends ApiResponse<TestResult> {}
