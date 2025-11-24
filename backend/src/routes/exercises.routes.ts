import { Router, Request, Response } from 'express';
import { ExerciseLoader } from '../services/ExerciseLoader';
import { ApiResponse } from '../types/api.types';
import { Exercise } from '../types/exercise.types';

function replaceApiUrls(exercise: Exercise, publicUrl: string): Exercise {
  return {
    ...exercise,
    description: exercise.description.replace(/\/api\//g, `${publicUrl}/api/`),
    starterCode: exercise.starterCode?.replace(/\/api\//g, `${publicUrl}/api/`),
    referenceCode: exercise.referenceCode?.replace(/\/api\//g, `${publicUrl}/api/`),
    apiDocumentation: exercise.apiDocumentation ? {
      ...exercise.apiDocumentation,
      baseUrl: publicUrl + '/api'
    } : undefined
  };
}

export function createExercisesRouter(exerciseLoader: ExerciseLoader): Router {
  const router = Router();

  // GET /api/exercises - List all exercises
  router.get('/', (req: Request, res: Response) => {
    try {
      const exercises = exerciseLoader.getAllExercises();
      const publicUrl = process.env.PUBLIC_URL || 'http://localhost';

      // Replace API URL placeholders in all exercises
      const updatedExercises = exercises.map(exercise => replaceApiUrls(exercise, publicUrl));

      const response: ApiResponse = {
        success: true,
        data: updatedExercises
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      res.status(500).json(response);
    }
  });

  // GET /api/exercises/:id - Get single exercise
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const exercise = exerciseLoader.getExercise(id);

      if (!exercise) {
        const response: ApiResponse = {
          success: false,
          error: 'Exercise not found'
        };

        return res.status(404).json(response);
      }

      // Replace API URL placeholders in description with actual PUBLIC_URL
      const publicUrl = process.env.PUBLIC_URL || 'http://localhost';
      const updatedExercise = replaceApiUrls(exercise, publicUrl);

      const response: ApiResponse = {
        success: true,
        data: updatedExercise
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      res.status(500).json(response);
    }
  });

  // GET /api/exercises/:id/solution - Get reference solution
  router.get('/:id/solution', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const exercise = exerciseLoader.getExerciseWithSolution(id);

      if (!exercise) {
        const response: ApiResponse = {
          success: false,
          error: 'Exercise not found'
        };

        return res.status(404).json(response);
      }

      // Replace API URL placeholders in reference code with actual PUBLIC_URL
      const publicUrl = process.env.PUBLIC_URL || 'http://localhost';
      const updatedExercise = replaceApiUrls(exercise, publicUrl);

      const response: ApiResponse = {
        success: true,
        data: {
          id: updatedExercise.id,
          referenceCode: updatedExercise.referenceCode
        }
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      res.status(500).json(response);
    }
  });

  return router;
}
