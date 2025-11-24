import { Router, Request, Response } from 'express';
import { ExerciseLoader } from '../services/ExerciseLoader';
import { TestRunner } from '../services/TestRunner';
import { SubmitCodeRequest, SubmitCodeResponse } from '../types/api.types';

export function createSubmitRouter(exerciseLoader: ExerciseLoader, testRunner: TestRunner): Router {
  const router = Router();

  // POST /api/submit - Submit code for testing
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { code, exerciseId }: SubmitCodeRequest = req.body;

      if (!code || !exerciseId) {
        const response: SubmitCodeResponse = {
          success: false,
          error: 'Campos obrigatórios faltando: code, exerciseId'
        };

        return res.status(400).json(response);
      }

      // Get exercise with full test case details
      const exercise = exerciseLoader.getExerciseForTesting(exerciseId);

      if (!exercise) {
        const response: SubmitCodeResponse = {
          success: false,
          error: 'Exercício não encontrado'
        };

        return res.status(404).json(response);
      }

      // Run tests
      const testResult = await testRunner.runTests(exercise, code);

      const response: SubmitCodeResponse = {
        success: true,
        data: testResult
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao executar testes:', error);

      const response: SubmitCodeResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Ocorreu um erro ao executar os testes'
      };

      res.status(500).json(response);
    }
  });

  // POST /api/submit/manual - Run code manually with custom arguments
  router.post('/manual', async (req: Request, res: Response) => {
    try {
      const { code, exerciseId, args } = req.body;

      if (!code || !exerciseId || !Array.isArray(args)) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios faltando: code, exerciseId, args'
        });
      }

      const exercise = exerciseLoader.getExerciseForTesting(exerciseId);

      if (!exercise) {
        return res.status(404).json({
          success: false,
          error: 'Exercício não encontrado'
        });
      }

      // Run code manually with provided arguments
      const result = await testRunner.runManually(exercise, code, args);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erro ao executar código manualmente:', error);

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Ocorreu um erro ao executar o código'
      });
    }
  });

  return router;
}
