import type { ChatServer } from './chat-handler';

/**
 * Singleton holder for the Socket.io server instance
 * This module allows other parts of the application to emit events to WebSocket rooms
 * without creating circular dependencies with index.ts
 */
let socketInstance: ChatServer | null = null;

/**
 * Set the Socket.io server instance
 * Should be called once during server initialization
 */
export function setSocketInstance(io: ChatServer): void {
  socketInstance = io;
}

/**
 * Get the Socket.io server instance
 * Returns null if not yet initialized
 */
export function getSocketInstance(): ChatServer | null {
  return socketInstance;
}

/**
 * Get the Socket.io server instance, throwing if not initialized
 * Use this when you're certain the socket has been initialized
 */
export function requireSocketInstance(): ChatServer {
  if (!socketInstance) {
    throw new Error('Socket.io instance not initialized. Ensure setSocketInstance() is called during server startup.');
  }
  return socketInstance;
}
