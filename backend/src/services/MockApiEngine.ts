import { Router, Request, Response } from 'express';
import { Exercise, EndpointConfig } from '../types/exercise.types';
import { FakerDB } from './FakerDB';
import { PaginatedApiResponse } from '../types/api.types';

export class MockApiEngine {
  private router: Router;
  private endpointMap: Map<string, { exerciseId: string; endpoint: EndpointConfig }> = new Map();

  constructor(private fakerDB: FakerDB) {
    this.router = Router();
  }

  public generateEndpoints(exercises: Exercise[]): Router {
    console.log('Gerando endpoints de mock API...');

    for (const exercise of exercises) {
      for (const endpoint of exercise.mockApi.endpoints) {
        this.registerEndpoint(endpoint, exercise.id);
      }
    }

    console.log('Endpoints de mock API gerados');
    return this.router;
  }

  private registerEndpoint(endpoint: EndpointConfig, exerciseId: string): void {
    const { path, method } = endpoint;

    console.log(`Registrando endpoint: ${method} ${path}`);

    // Store mapping for handler
    this.endpointMap.set(path, { exerciseId, endpoint });

    // Register route based on method
    const handler = (req: Request, res: Response) => {
      this.handleRequest(req, res, path);
    };

    switch (method) {
      case 'GET':
        this.router.get(path, handler);
        break;
      case 'POST':
        this.router.post(path, handler);
        break;
      case 'PUT':
        this.router.put(path, handler);
        break;
      case 'DELETE':
        this.router.delete(path, handler);
        break;
    }
  }

  private handleRequest(req: Request, res: Response, path: string): any {
    try {
      const mapping = this.endpointMap.get(path);
      if (!mapping) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }

      const { exerciseId, endpoint } = mapping;
      const { paginated, perPage = 10 } = endpoint;

      // Get query parameters
      const page = parseInt(req.query.page as string) || 1;
      const filters: Record<string, any> = {};

      // GENERIC: Extract ALL filters based on endpoint's queryParams definition
      if (endpoint.queryParams) {
        for (const param of endpoint.queryParams) {
          if (param !== 'page' && req.query[param] !== undefined) {
            filters[param] = req.query[param];
          }
        }
      }

      // Query data from FakerDB (single source of truth)
      const data = this.fakerDB.queryData(exerciseId, path, {
        page,
        perPage,
        filters: Object.keys(filters).length > 0 ? filters : undefined
      });

      const totalRecords = this.fakerDB.getTotalCount(exerciseId, path, filters);
      const totalPages = Math.ceil(totalRecords / perPage);

      // Build response
      if (paginated) {
        const response: PaginatedApiResponse = {
          page,
          per_page: perPage,
          total: totalRecords,
          total_pages: totalPages,
          data
        };

        res.json(response);
      } else {
        res.json({ data });
      }
    } catch (error) {
      console.error('Erro ao processar requisição de mock API:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
