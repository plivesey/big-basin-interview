import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { db, sessions, Session, NewSession } from '../db';

export interface ChatSession {
  id: string;
  userId: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  lastActivityAt: Date;
}

/**
 * Create a new chat session
 */
export async function createSession(userId: string = 'default_user'): Promise<ChatSession> {
  const now = new Date();

  const newSession: NewSession = {
    id: uuidv4(),
    userId,
    status: 'active',
    createdAt: now,
    lastActivityAt: now,
  };

  await db.insert(sessions).values(newSession);

  return {
    id: newSession.id,
    userId,
    status: 'active' as const,
    createdAt: now,
    lastActivityAt: now,
  };
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<ChatSession | null> {
  if (!sessionId || !sessionId.trim()) {
    return null;
  }

  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const session = result[0];
  return {
    id: session.id,
    userId: session.userId,
    status: session.status as 'active' | 'inactive',
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
  };
}

/**
 * Update session's last activity timestamp
 */
export async function updateSessionActivity(sessionId: string): Promise<ChatSession | null> {
  if (!sessionId || !sessionId.trim()) {
    return null;
  }

  const now = new Date();

  await db
    .update(sessions)
    .set({ lastActivityAt: now })
    .where(eq(sessions.id, sessionId));

  return getSession(sessionId);
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: 'active' | 'inactive'
): Promise<ChatSession | null> {
  if (!sessionId || !sessionId.trim()) {
    return null;
  }

  await db
    .update(sessions)
    .set({ status, lastActivityAt: new Date() })
    .where(eq(sessions.id, sessionId));

  return getSession(sessionId);
}

/**
 * Get or create a session
 * If sessionId is provided and valid, returns existing session
 * Otherwise creates a new session
 */
export async function getOrCreateSession(sessionId?: string): Promise<ChatSession> {
  if (sessionId) {
    const existingSession = await getSession(sessionId);
    if (existingSession) {
      // Update activity timestamp
      await updateSessionActivity(sessionId);
      return existingSession;
    }
  }

  // Create new session
  return createSession();
}

/**
 * Delete a session (useful for testing)
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  if (!sessionId || !sessionId.trim()) {
    return false;
  }

  const result = await db
    .delete(sessions)
    .where(eq(sessions.id, sessionId));

  return result.changes > 0;
}
