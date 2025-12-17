import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { logger } from './utils/logger';
import { initializeChatHandler, ChatServer } from './websocket/chat-handler';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.io server with CORS configuration
const io: ChatServer = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// Heartbeat endpoint
app.get('/api/heartbeat', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Initialize WebSocket chat handler
initializeChatHandler(io);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`WebSocket server ready for connections`);
});
