import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { initializeChatHandler } from '../../src/websocket/chat-handler';
import type { ChatServer } from '../../src/websocket/chat-handler';

describe('WebSocket Chat Handler Integration', () => {
  let httpServer: ReturnType<typeof createServer>;
  let ioServer: ChatServer;
  let clientSocket: Socket;
  const PORT = 3099; // Use a different port for tests

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = new Server(httpServer, {
      cors: {
        origin: '*',
      },
    });

    initializeChatHandler(ioServer);

    httpServer.listen(PORT, () => {
      done();
    });
  });

  afterAll(() => {
    ioServer.close();
    httpServer.close();
  });

  beforeEach((done) => {
    // Create a new client socket for each test
    clientSocket = ioc(`http://localhost:${PORT}`, {
      transports: ['websocket'],
    });
    clientSocket.on('connect', () => {
      done();
    });
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('connection', () => {
    it('should connect to server', (done) => {
      // The beforeEach already waits for connection, but let's ensure it
      if (clientSocket.connected) {
        expect(clientSocket.connected).toBe(true);
        done();
      } else {
        clientSocket.on('connect', () => {
          expect(clientSocket.connected).toBe(true);
          done();
        });
      }
    });

    it('should receive session_created event on connection', (done) => {
      // Disconnect and reconnect to get the event
      clientSocket.disconnect();

      const newClient = ioc(`http://localhost:${PORT}`, {
        transports: ['websocket'],
      });

      newClient.on('session_created', (data) => {
        expect(data).toHaveProperty('sessionId');
        expect(typeof data.sessionId).toBe('string');
        expect(data.sessionId.length).toBeGreaterThan(0);
        newClient.disconnect();
        done();
      });
    });

    it('should receive message_history event on connection', (done) => {
      clientSocket.disconnect();

      const newClient = ioc(`http://localhost:${PORT}`, {
        transports: ['websocket'],
      });

      newClient.on('message_history', (data) => {
        expect(data).toHaveProperty('messages');
        expect(Array.isArray(data.messages)).toBe(true);
        newClient.disconnect();
        done();
      });
    });
  });

  describe('user_message', () => {
    it('should echo back user message', (done) => {
      const testMessage = 'Hello, Echo Bot!';

      clientSocket.on('assistant_message', (data) => {
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('content');
        expect(data).toHaveProperty('timestamp');
        expect(data.content).toBe(`Echo: ${testMessage}`);
        done();
      });

      clientSocket.emit('user_message', { message: testMessage });
    });

    it('should emit message_start before assistant_message', (done) => {
      let messageStartReceived = false;

      clientSocket.on('message_start', (data) => {
        expect(data).toHaveProperty('messageId');
        messageStartReceived = true;
      });

      clientSocket.on('assistant_message', () => {
        expect(messageStartReceived).toBe(true);
        done();
      });

      clientSocket.emit('user_message', { message: 'Test message' });
    });

    it('should emit message_complete after assistant_message', (done) => {
      let assistantMessageReceived = false;

      clientSocket.on('assistant_message', () => {
        assistantMessageReceived = true;
      });

      clientSocket.on('message_complete', (data) => {
        expect(assistantMessageReceived).toBe(true);
        expect(data).toHaveProperty('messageId');
        done();
      });

      clientSocket.emit('user_message', { message: 'Test message' });
    });

    it('should return error for empty message', (done) => {
      clientSocket.on('error', (data) => {
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('code');
        expect(data.code).toBe('INVALID_MESSAGE');
        done();
      });

      clientSocket.emit('user_message', { message: '' });
    });

    it('should return error for whitespace-only message', (done) => {
      clientSocket.on('error', (data) => {
        expect(data.code).toBe('INVALID_MESSAGE');
        done();
      });

      clientSocket.emit('user_message', { message: '   ' });
    });
  });

  describe('session persistence', () => {
    it('should persist messages in history', (done) => {
      const testMessage = 'Persistent message test';

      // Send a message
      clientSocket.emit('user_message', { message: testMessage });

      // Wait for echo response
      clientSocket.on('message_complete', () => {
        // Request sync to get updated history
        clientSocket.emit('sync', {});
      });

      clientSocket.on('message_history', (data) => {
        // Should have at least 2 messages (user + assistant)
        if (data.messages.length >= 2) {
          const userMsg = data.messages.find(
            (m: { role: string; content: { type: string; text: string }[] }) =>
              m.role === 'user' && m.content[0]?.text === testMessage
          );
          const assistantMsg = data.messages.find(
            (m: { role: string; content: { type: string; text: string }[] }) =>
              m.role === 'assistant' && m.content[0]?.text === `Echo: ${testMessage}`
          );

          expect(userMsg).toBeDefined();
          expect(assistantMsg).toBeDefined();
          done();
        }
      });
    });

    it('should restore session with existing sessionId', (done) => {
      let sessionId: string;

      // Get session ID from first connection
      clientSocket.on('session_created', (data) => {
        sessionId = data.sessionId;

        // Send a message
        clientSocket.emit('user_message', { message: 'Session test' });
      });

      clientSocket.on('message_complete', () => {
        // Disconnect and reconnect with same session ID
        clientSocket.disconnect();

        const newClient = ioc(`http://localhost:${PORT}`, {
          transports: ['websocket'],
          query: { sessionId },
        });

        newClient.on('session_created', (data) => {
          expect(data.sessionId).toBe(sessionId);
        });

        newClient.on('message_history', (data) => {
          // Should have the messages from before
          expect(data.messages.length).toBeGreaterThan(0);
          newClient.disconnect();
          done();
        });
      });
    });
  });
});
