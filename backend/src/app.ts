import express from 'express';
import cors from 'cors';
import providerRoutes from './routes/providers';
import bookingRoutes from './routes/bookings';
import sessionRoutes from './routes/sessions';
import workflowRoutes from './routes/workflows';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/error-handler';

export function createApp() {
  const app = express();

  // Middleware
  // CORS disabled for demo purposes - allows all origins
  app.use(cors());
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
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/workflows', workflowRoutes);

  // Google OAuth routes (non-prefixed for OAuth callback compatibility)
  app.use('/auth', authRoutes);

  // Error handler middleware (must be registered after routes)
  app.use(errorHandler);

  return app;
}
