import fs from 'fs';
import path from 'path';
import { Exercise } from '../types/exercise.types';

export class ExerciseLoader {
  private exercises: Map<string, Exercise> = new Map();
  private exercisesDir: string;

  constructor(exercisesDir: string = '/app/exercises') {
    this.exercisesDir = exercisesDir;
    this.loadExercises();
  }

  private loadExercises(): void {
    console.log(`Carregando exercícios de: ${this.exercisesDir}`);

    if (!fs.existsSync(this.exercisesDir)) {
      console.warn(`Diretório de exercícios não encontrado: ${this.exercisesDir}`);
      return;
    }

    const files = fs.readdirSync(this.exercisesDir);

    for (const file of files) {
      if (file.endsWith('.json') && file !== 'exercise-schema.json') {
        try {
          const filePath = path.join(this.exercisesDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const exercise: Exercise = JSON.parse(content);

          this.exercises.set(exercise.id, exercise);
          console.log(`Exercício carregado: ${exercise.id} - ${exercise.title}`);
        } catch (error) {
          console.error(`Erro ao carregar exercício de ${file}:`, error);
        }
      }
    }

    console.log(`Total de exercícios carregados: ${this.exercises.size}`);
  }

  public getAllExercises(): Exercise[] {
    return Array.from(this.exercises.values()).map(exercise => ({
      ...exercise,
      referenceCode: undefined as any, // Don't expose reference code in list
      testCases: exercise.testCases.map(tc => ({
        ...tc,
        expectedOutput: tc.type === 'visible' ? tc.expectedOutput : undefined,
        validationLogic: undefined as any,
        customValidator: undefined as any
      }))
    }));
  }

  public getExercise(id: string): Exercise | null {
    const exercise = this.exercises.get(id);
    if (!exercise) {
      return null;
    }

    // Return exercise without reference code and hide hidden test case details
    return {
      ...exercise,
      referenceCode: undefined as any,
      testCases: exercise.testCases.map(tc => ({
        ...tc,
        expectedOutput: tc.type === 'visible' ? tc.expectedOutput : undefined,
        validationLogic: undefined as any,
        customValidator: undefined as any
      }))
    };
  }

  public getExerciseWithSolution(id: string): Exercise | null {
    return this.exercises.get(id) || null;
  }

  public getExerciseForTesting(id: string): Exercise | null {
    // Returns full exercise including all test case details for testing
    return this.exercises.get(id) || null;
  }

  public reload(): void {
    this.exercises.clear();
    this.loadExercises();
  }
}
