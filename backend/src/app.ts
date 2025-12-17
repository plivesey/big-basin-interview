import express from 'express';
import cors from 'cors';
import providerRoutes from './routes/providers';
import { errorHandler } from './middleware/error-handler';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
  }));
  app.use(express.json());

  // Heartbeat endpoint
  app.get('/api/heartbeat', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Server is running'
    });
  });

  // API Routes
  app.use('/api/providers', providerRoutes);

  // Error handler middleware (must be registered after routes)
  app.use(errorHandler);

  return app;
}
