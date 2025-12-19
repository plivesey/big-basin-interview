import { v4 as uuidv4 } from 'uuid';
import { eq, desc } from 'drizzle-orm';
import { db, sessions, workflowStates, bookings, providers, NewSession } from '../db';

export interface ChatSession {
  id: string;
  userId: string;
  currentWorkflowId: string | null;
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
    currentWorkflowId: null,
    createdAt: now,
    lastActivityAt: now,
  };

  await db.insert(sessions).values(newSession);

  return {
    id: newSession.id,
    userId,
    currentWorkflowId: null,
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
    currentWorkflowId: session.currentWorkflowId ?? null,
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

/**
 * Set the current workflow ID for a session
 */
export async function setCurrentWorkflow(
  sessionId: string,
  workflowId: string | null
): Promise<ChatSession | null> {
  if (!sessionId || !sessionId.trim()) {
    return null;
  }

  await db
    .update(sessions)
    .set({ currentWorkflowId: workflowId })
    .where(eq(sessions.id, sessionId));

  return getSession(sessionId);
}

/**
 * Session list item for displaying in the sidebar
 */
export interface SessionListItem {
  id: string;
  title: string;
  date: string; // ISO format
}

/**
 * Get all sessions with computed titles for display in sidebar.
 * Title priority:
 * 1. Most recent booking's provider name
 * 2. Most recent workflow's serviceType
 * 3. Fallback to "Scout"
 */
export async function getSessionsWithTitles(
  userId: string = 'default_user'
): Promise<SessionListItem[]> {
  // Fetch all sessions for user, ordered by last activity
  const allSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.lastActivityAt));

  const result: SessionListItem[] = [];

  for (const session of allSessions) {
    let title = 'Scout';

    // Get all workflows for this session to find bookings and serviceType
    const sessionWorkflows = await db
      .select({
        context: workflowStates.context,
        lastUpdated: workflowStates.lastUpdated,
      })
      .from(workflowStates)
      .where(eq(workflowStates.sessionId, session.id))
      .orderBy(desc(workflowStates.lastUpdated));

    // Find the most recent booking from workflows with bookingId
    let foundBookingProvider = false;
    for (const workflow of sessionWorkflows) {
      if (workflow.context?.bookingId) {
        const bookingResult = await db
          .select({
            providerName: providers.name,
          })
          .from(bookings)
          .innerJoin(providers, eq(providers.id, bookings.providerId))
          .where(eq(bookings.id, workflow.context.bookingId))
          .limit(1);

        if (bookingResult.length > 0 && bookingResult[0].providerName) {
          title = bookingResult[0].providerName;
          foundBookingProvider = true;
          break;
        }
      }
    }

    // If no booking found, try to get serviceType from most recent workflow
    if (!foundBookingProvider && sessionWorkflows.length > 0) {
      const latestWorkflow = sessionWorkflows[0];
      if (latestWorkflow.context?.serviceType) {
        title = latestWorkflow.context.serviceType;
      }
    }

    result.push({
      id: session.id,
      title,
      date: session.lastActivityAt.toISOString(),
    });
  }

  return result;
}
