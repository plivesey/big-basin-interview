// Import env first to trigger validation before any other code runs
import { env } from './config/env';

import { createServer } from 'http';
import { Server } from 'socket.io';
import { logger } from './utils/logger';
import { initializeChatHandler, ChatServer } from './websocket/chat-handler';
import { createApp } from './app';

// Log successful environment validation
logger.info('Environment validated', {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  logLevel: env.LOG_LEVEL,
  claudeModel: env.CLAUDE_MODEL,
  hasAnthropicKey: !!env.ANTHROPIC_API_KEY,
  hasGoogleCalendar: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
});

const app = createApp();
const PORT = env.PORT;

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.io server
// CORS disabled for demo purposes - allows all origins
const io: ChatServer = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

// Initialize WebSocket chat handler
initializeChatHandler(io);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  logger.info(`WebSocket server ready for connections`);
});
