import { faker } from '@faker-js/faker';
import { DataGenerator } from '../types/exercise.types';

export class FakerDataGenerator {
  private faker: typeof faker;

  constructor(seed?: number) {
    this.faker = faker;
    if (seed) {
      this.faker.seed(seed);
    }
  }

  public generateData(generator: DataGenerator, page: number = 1, perPage: number = 10, filterByCity?: string): any[] {
    // Handle city-based data
    if (generator.cityBasedData && filterByCity) {
      const cityData = generator.cityBasedData[filterByCity] || [];
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      return cityData.slice(startIndex, endIndex);
    }

    // Handle static records first
    if (generator.staticRecords && generator.staticRecords.length > 0) {
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;

      // If we have enough static records for this page, return them
      if (startIndex < generator.staticRecords.length) {
        const staticData = generator.staticRecords.slice(startIndex, endIndex);

        // Fill remaining with generated data if needed
        const remaining = perPage - staticData.length;
        if (remaining > 0 && generator.itemSchema) {
          const generatedData = this.generateFromSchema(generator.itemSchema, remaining, startIndex + staticData.length);
          return [...staticData, ...generatedData];
        }

        return staticData;
      }

      // If we're past static records, generate data
      if (generator.itemSchema) {
        return this.generateFromSchema(generator.itemSchema, perPage, startIndex);
      }
    }

    // Generate data from schema
    if (generator.itemSchema) {
      const startIndex = (page - 1) * perPage;
      return this.generateFromSchema(generator.itemSchema, perPage, startIndex);
    }

    return [];
  }

  private generateFromSchema(schema: Record<string, string>, count: number, offset: number = 0): any[] {
    const results: any[] = [];

    for (let i = 0; i < count; i++) {
      const item: any = {};

      for (const [key, template] of Object.entries(schema)) {
        item[key] = this.evaluateTemplate(template, i + offset);
      }

      results.push(item);
    }

    return results;
  }

  private evaluateTemplate(template: string, index: number): any {
    // Check if template is a faker expression: {{faker.method()}}
    const fakerMatch = template.match(/^\{\{(.+)\}\}$/);

    if (fakerMatch) {
      const expression = fakerMatch[1].trim();
      return this.evaluateFakerExpression(expression, index);
    }

    // If not a template, return as-is
    return template;
  }

  private evaluateFakerExpression(expression: string, index: number): any {
    try {
      // Handle special cases
      if (expression === 'page') return index + 1;
      if (expression === 'query.page || 1') return 1;

      // Parse faker method calls like "datatype.number({min: 1, max: 100})"
      const methodMatch = expression.match(/^([a-zA-Z]+)\.([a-zA-Z]+)(?:\((.*)\))?$/);

      if (methodMatch) {
        const [, module, method, argsStr] = methodMatch;

        // @ts-ignore
        const fakerModule = this.faker[module];

        if (!fakerModule || typeof fakerModule[method] !== 'function') {
          console.warn(`Método Faker não encontrado: ${module}.${method}`);
          return null;
        }

        // Parse arguments if present
        let args: any = undefined;
        if (argsStr) {
          try {
            // Convert {min: 1, max: 100} to proper JSON
            const jsonStr = argsStr.replace(/(\w+):/g, '"$1":');
            args = JSON.parse(jsonStr);
          } catch (e) {
            console.warn(`Falha ao analisar argumentos: ${argsStr}`);
          }
        }

        // Call faker method
        return fakerModule[method](args);
      }

      return null;
    } catch (error) {
      console.error(`Erro ao avaliar expressão faker: ${expression}`, error);
      return null;
    }
  }

  public getTotalRecords(generator: DataGenerator, filterByCity?: string): number {
    if (generator.cityBasedData && filterByCity) {
      return generator.cityBasedData[filterByCity]?.length || 0;
    }
    return generator.staticRecords?.length || generator.totalRecords || 50;
  }
}
