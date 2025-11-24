import express, { Application } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ExerciseLoader } from './services/ExerciseLoader';
import { FakerDB } from './services/FakerDB';
import { MockApiEngine } from './services/MockApiEngine';
import { TestRunner } from './services/TestRunner';
import { createExercisesRouter } from './routes/exercises.routes';
import { createSubmitRouter } from './routes/submit.routes';
import { errorHandler } from './middleware/errorHandler';

const PORT = process.env.PORT || 3001;
import path from 'path';
const EXERCISES_DIR = process.env.EXERCISES_DIR || path.resolve(__dirname, '../../exercises');

class Server {
  private app: Application;
  private exerciseLoader: ExerciseLoader;
  private fakerDB: FakerDB;
  private mockApiEngine: MockApiEngine;
  private testRunner: TestRunner;

  constructor() {
    this.app = express();

    // Initialize exercise loader
    this.exerciseLoader = new ExerciseLoader(EXERCISES_DIR);

    // Initialize FakerDB with all exercises (single source of truth)
    console.log('');
    console.log('Inicializando FakerDB...');
    this.fakerDB = new FakerDB();
    const exercises = this.exerciseLoader.getAllExercises();
    this.fakerDB.initializeAllDatasets(exercises);
    console.log('FakerDB inicializado com sucesso');
    console.log('');

    // Initialize services with FakerDB
    this.mockApiEngine = new MockApiEngine(this.fakerDB);
    // TestRunner will use PUBLIC_URL env var if set (for ngrok), otherwise localhost
    this.testRunner = new TestRunner(this.fakerDB);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // CORS
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Body parser
    this.app.use(bodyParser.json({ limit: '10mb' }));
    this.app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Exercise routes
    this.app.use('/api/exercises', createExercisesRouter(this.exerciseLoader));

    // Submit route
    this.app.use('/api/submit', createSubmitRouter(this.exerciseLoader, this.testRunner));

    // Mock API routes (generated from exercises)
    const mockApiRouter = this.mockApiEngine.generateEndpoints(
      this.exerciseLoader.getAllExercises()
    );
    this.app.use('/api', mockApiRouter);

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not found',
        path: req.path
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public start(): void {
    this.app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  🚀 Servidor Backend de Desafios');
      console.log('═══════════════════════════════════════════════════════════');
      const publicUrl = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
      console.log(`  📡 Servidor rodando em: http://localhost:${PORT}`);
      console.log(`  🌐 URL Pública: ${publicUrl}`);
      console.log(`  📂 Diretório de exercícios: ${EXERCISES_DIR}`);
      console.log(`  💚 Health check: http://localhost:${PORT}/health`);
      console.log(`  📚 API de Exercícios: ${publicUrl}/api/exercises`);
      console.log(`  🧪 API de Submissão: ${publicUrl}/api/submit`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
    });
  }
}

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error(error.stack);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit - keep server running
});

// Start server
const server = new Server();
server.start();
