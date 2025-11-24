import axios from 'axios';
import { Exercise, TestResult } from '../types/exercise.types';

const API_BASE_URL = '/api';

export const api = {
  // Get all exercises
  async getExercises(): Promise<Exercise[]> {
    const response = await axios.get(`${API_BASE_URL}/exercises`);
    return response.data.data;
  },

  // Get single exercise
  async getExercise(id: string): Promise<Exercise> {
    const response = await axios.get(`${API_BASE_URL}/exercises/${id}`);
    return response.data.data;
  },

  // Submit code for testing
  async submitCode(exerciseId: string, code: string): Promise<TestResult> {
    const response = await axios.post(`${API_BASE_URL}/submit`, {
      exerciseId,
      code
    });
    return response.data.data;
  },

  // Get reference solution
  async getSolution(id: string): Promise<{ id: string; referenceCode: string }> {
    const response = await axios.get(`${API_BASE_URL}/exercises/${id}/solution`);
    return response.data.data;
  },

  // Run code manually with custom arguments
  async runManually(exerciseId: string, code: string, args: any[]): Promise<{
    result: any;
    stdout: string;
    stderr: string;
    executionTime: number;
    error?: string;
  }> {
    const response = await axios.post(`${API_BASE_URL}/submit/manual`, {
      exerciseId,
      code,
      args
    });
    return response.data.data;
  }
};
