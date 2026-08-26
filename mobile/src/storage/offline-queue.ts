import { logger } from '../utils/logger';
import type { ChatSocket } from '../socket/events';

export interface QueuedMessage {
  id: string;
  text: string;
  queuedAt: number;
}

// Module level so the queue survives a remount of the chat screen -- expo-router
// unmounts the route when you push provider detail, and a queued message
// shouldn't disappear because someone tapped a provider card.
let pendingQueue: QueuedMessage[] = [];

export function enqueue(message: QueuedMessage): void {
  pendingQueue.push(message);
}

export function getQueue(): QueuedMessage[] {
  return pendingQueue;
}

/**
 * Drain everything that was typed while we were offline.
 *
 * The server persists messages in the order they arrive, so ordering is
 * preserved and there is nothing else to coordinate.
 */
export function flushQueue(socket: ChatSocket): void {
  if (!socket.connected) {
    return;
  }

  const queued = pendingQueue;
  // Clear first, so a reconnect that fires twice can't send the same text
  // twice.
  pendingQueue = [];

  if (queued.length === 0) {
    return;
  }

  logger.debug('Flushing offline queue', { count: queued.length });

  queued.forEach((item) => {
    socket.emit('user_message', { message: item.text });
  });
}

/** Test-only: drop anything left over between cases. */
export function __resetQueueForTests(): void {
  pendingQueue = [];
}
