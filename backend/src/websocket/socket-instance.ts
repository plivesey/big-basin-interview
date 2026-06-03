import type { ChatServer } from './chat-handler';

/**
 * Singleton holder for the Socket.io server instance.
 *
 * This lets code that needs to push messages to a session (for example the
 * booking routes) get a handle on the live Socket.io server without creating a
 * circular import with index.ts.
 */
let socketInstance: ChatServer | null = null;

/**
 * Store the Socket.io server instance.
 * Called once during server startup.
 */
export function setSocketInstance(io: ChatServer): void {
  socketInstance = io;
}

/**
 * Get the Socket.io server instance, or null if it hasn't been set up yet.
 */
export function getSocketInstance(): ChatServer | null {
  return socketInstance;
}
