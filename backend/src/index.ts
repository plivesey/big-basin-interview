import { createServer } from 'http';
import { Server } from 'socket.io';
import { logger } from './utils/logger';
import { initializeChatHandler, ChatServer } from './websocket/chat-handler';
import { createApp } from './app';

const app = createApp();
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

// Initialize WebSocket chat handler
initializeChatHandler(io);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`WebSocket server ready for connections`);
});
