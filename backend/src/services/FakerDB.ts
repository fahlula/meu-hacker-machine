import { faker } from '@faker-js/faker';
import Chance from 'chance';
import casual from 'casual';
import { Exercise, DataGenerator } from '../types/exercise.types';

const chance = new Chance();

export interface GeneratedDataset {
  exerciseId: string;
  endpointPath: string;
  data: any[];
  totalRecords: number;
  perPage: number;
  metadata: {
    seed: number;
    generatedAt: Date;
  };
}

export interface QueryOptions {
  page?: number;
  perPage?: number;
  filters?: Record<string, any>;
}

export class FakerDB {
  private datasets: Map<string, GeneratedDataset[]> = new Map();

  /**
   * Initialize all datasets for all exercises on startup
   */
  public initializeAllDatasets(exercises: Exercise[]): void {
    console.log('Inicializando FakerDB com datasets de exercícios...');

    for (const exercise of exercises) {
      this.initializeExerciseDatasets(exercise);
    }

    console.log(`FakerDB inicializado com ${this.datasets.size} datasets de exercícios`);
  }

  /**
   * Initialize datasets for a single exercise
   */
  private initializeExerciseDatasets(exercise: Exercise): void {
    const datasets: GeneratedDataset[] = [];

    for (const endpoint of exercise.mockApi.endpoints) {
      const dataset = this.generateDataset(
        exercise.id,
        endpoint.path,
        endpoint.dataGenerator,
        endpoint.totalRecords || 1000,
        endpoint.perPage || 10
      );

      datasets.push(dataset);
      console.log(`  Gerados ${dataset.totalRecords} registros para ${exercise.id}${endpoint.path}`);
    }

    this.datasets.set(exercise.id, datasets);
  }

  /**
   * Generate a complete dataset for an endpoint
   */
  private generateDataset(
    exerciseId: string,
    endpointPath: string,
    dataGenerator: DataGenerator,
    totalRecords: number,
    perPage: number
  ): GeneratedDataset {
    // Initialize faker with seed for deterministic results
    const seed = dataGenerator.seed || 12345;
    faker.seed(seed);

    const data: any[] = [];

    // Handle city-based data (for multi-city exercises like food-outlets)
    if (dataGenerator.cityBasedData) {
      for (const [city, cityRecords] of Object.entries(dataGenerator.cityBasedData)) {
        data.push(...cityRecords);
      }
    } else if (dataGenerator.itemSchema) {
      // Generate records from schema
      for (let i = 0; i < totalRecords; i++) {
        const record = this.generateRecordFromSchema(dataGenerator.itemSchema, i);
        data.push(record);
      }
    }

    return {
      exerciseId,
      endpointPath,
      data,
      totalRecords: data.length,
      perPage,
      metadata: {
        seed,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Generate a single record from a schema template
   */
  private generateRecordFromSchema(schema: Record<string, any>, index: number): any {
    const record: any = {};

    for (const [key, value] of Object.entries(schema)) {
      try {
        // Handle nested objects
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          record[key] = this.generateRecordFromSchema(value, index);
        } else if (typeof value === 'string') {
          record[key] = this.evaluateTemplate(value, index);
        } else {
          record[key] = value;
        }
      } catch (e: any) {
        console.error(`Failed to generate field "${key}" for index ${index}:`, e.message);
        // Use fallback value instead of crashing
        record[key] = null;
      }
    }

    return record;
  }


  /**
   * Evaluate a template string supporting faker, chance, and casual
   * Uses JavaScript's native Function for robust evaluation (handles nesting, chaining, everything!)
   */
  private evaluateTemplate(template: string, index: number): any {
    // Check if template contains any expressions
    if (!template.includes('{{')) {
      return template; // Return as-is if no template expressions
    }

    // Check if template has multiple expressions (e.g., "{{expr1}} {{expr2}}")
    const multiExpressionPattern = /\{\{.+?\}\}/g;
    const matches = template.match(multiExpressionPattern);

    if (matches && matches.length > 1) {
      // Handle multiple expressions by replacing each one
      let result = template;
      for (const match of matches) {
        const evaluated = this.evaluateTemplate(match, index);
        result = result.replace(match, String(evaluated));
      }
      return result;
    }

    // Check if template is a single expression: {{expression}}
    const expressionMatch = template.match(/^\{\{(.+?)\}\}$/);

    if (!expressionMatch) {
      return template; // Return as-is if not a template
    }

    let expression = expressionMatch[1].trim();

    // Handle special cases
    if (expression === 'index') return index;
    if (expression === 'index + 1') return index + 1;

    // Check if it's a library call (faker/chance/casual)
    if (/^(faker|chance|casual)\./.test(expression)) {
      try {
        // Use Function to evaluate - handles EVERYTHING automatically:
        // - Nested calls: chance.date({year: chance.year({min: 1995, max: 2024})})
        // - Method chaining: chance.twitter().substring(1)
        // - Complex arguments: chance.pickone(['a', 'b', 'c'])
        const func = new Function('faker', 'chance', 'casual', 'index', `
          'use strict';
          try {
            return ${expression};
          } catch (err) {
            console.error('Expression evaluation error:', err.message);
            throw err;
          }
        `);
        const result = func(faker, chance, casual, index);

        // Validate result is not undefined/null unexpectedly
        if (result === undefined || result === null) {
          console.warn(`Expression "${expression}" returned ${result}`);
        }

        return result;
      } catch (e: any) {
        console.error(`Failed to evaluate expression: ${expression}`);
        console.error(`Error: ${e.message}`);
        // Return null instead of crashing - field-level try-catch will handle it
        return null;
      }
    }

    // If not a library call, return expression as-is
    return expression;
  }

  /**
   * Query data with pagination and filters (for Mock API)
   */
  public queryData(exerciseId: string, endpointPath: string, options: QueryOptions = {}): any[] {
    const dataset = this.getDataset(exerciseId, endpointPath);
    if (!dataset) {
      throw new Error(`Dataset not found: ${exerciseId}${endpointPath}`);
    }

    let filteredData = dataset.data;

    // Apply filters
    if (options.filters) {
      filteredData = this.applyFilters(filteredData, options.filters);
    }

    // Apply pagination
    const page = options.page || 1;
    const perPage = options.perPage || dataset.perPage;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;

    return filteredData.slice(startIndex, endIndex);
  }

  /**
   * Get total count of filtered data
   */
  public getTotalCount(exerciseId: string, endpointPath: string, filters?: Record<string, any>): number {
    const dataset = this.getDataset(exerciseId, endpointPath);
    if (!dataset) return 0;

    let data = dataset.data;

    if (filters) {
      data = this.applyFilters(data, filters);
    }

    return data.length;
  }

  /**
   * Get full unfiltered dataset (for Test Runner validation)
   */
  public getFullData(exerciseId: string, endpointPath: string): any[] {
    const dataset = this.getDataset(exerciseId, endpointPath);
    if (!dataset) {
      throw new Error(`Dataset not found: ${exerciseId}${endpointPath}`);
    }

    return dataset.data;
  }

  /**
   * Get dataset metadata
   */
  public getDataset(exerciseId: string, endpointPath: string): GeneratedDataset | null {
    const datasets = this.datasets.get(exerciseId);
    if (!datasets) return null;

    return datasets.find(ds => ds.endpointPath === endpointPath) || null;
  }

  /**
   * Apply filters to data
   */
  private applyFilters(data: any[], filters: Record<string, any>): any[] {
    let filtered = data;

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        filtered = filtered.filter(item => item[key] === value);
      }
    }

    return filtered;
  }

  /**
   * Get all exercise IDs in the database
   */
  public getExerciseIds(): string[] {
    return Array.from(this.datasets.keys());
  }

  /**
   * Check if exercise exists in database
   */
  public hasExercise(exerciseId: string): boolean {
    return this.datasets.has(exerciseId);
  }
}
