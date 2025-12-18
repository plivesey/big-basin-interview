/**
 * Workflow Service
 *
 * CRUD operations for booking workflows with state machine validation.
 * Each session has a single active workflow at a time.
 */

import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { db, workflowStates, sessions } from '../db';
import {
  WorkflowState,
  WorkflowContext,
  WorkflowStateRecord,
} from '../types/workflow.types';
import { bookingStateMachine } from '../workflows/booking-state-machine';
import { logger } from '../utils/logger';

// Re-export types for convenience
export type { WorkflowStateRecord, WorkflowContext };
export { WorkflowState };

/**
 * Custom error for workflow not found
 */
export class WorkflowNotFoundError extends Error {
  constructor(workflowId: string) {
    super(`Workflow not found: ${workflowId}`);
    this.name = 'WorkflowNotFoundError';
  }
}

/**
 * Custom error for invalid state transitions
 */
export class InvalidTransitionError extends Error {
  constructor(from: WorkflowState, to: WorkflowState, reason?: string) {
    const message = reason
      ? `Invalid transition from ${from} to ${to}: ${reason}`
      : `Invalid transition from ${from} to ${to}`;
    super(message);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Convert database row to WorkflowStateRecord
 */
function toWorkflowRecord(row: {
  id: string;
  sessionId: string;
  currentState: string;
  context: WorkflowContext;
  createdAt: Date;
  lastUpdated: Date;
  completedAt: Date | null;
}): WorkflowStateRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    currentState: row.currentState as WorkflowState,
    context: row.context,
    createdAt: row.createdAt,
    lastUpdated: row.lastUpdated,
    completedAt: row.completedAt ?? undefined,
  };
}

/**
 * Create a new workflow for a session.
 * - Updates session.currentWorkflowId (replacing any previous workflow)
 */
export async function createWorkflow(
  sessionId: string,
  initialContext: Partial<WorkflowContext> = {}
): Promise<WorkflowStateRecord> {
  const now = new Date();
  const workflowId = uuidv4();
  const initialState = bookingStateMachine.getInitialState();

  // Create the new workflow
  const context: WorkflowContext = {
    ...initialContext,
  };

  await db.insert(workflowStates).values({
    id: workflowId,
    sessionId,
    currentState: initialState,
    context,
    createdAt: now,
    lastUpdated: now,
  });

  // Update session's currentWorkflowId
  await db
    .update(sessions)
    .set({ currentWorkflowId: workflowId })
    .where(eq(sessions.id, sessionId));

  logger.info('Created new workflow', {
    workflowId,
    sessionId,
    initialState,
    context,
  });

  return {
    id: workflowId,
    sessionId,
    currentState: initialState,
    context,
    createdAt: now,
    lastUpdated: now,
  };
}

/**
 * Get a workflow by ID
 */
export async function getWorkflow(
  workflowId: string
): Promise<WorkflowStateRecord | null> {
  if (!workflowId || !workflowId.trim()) {
    return null;
  }

  const result = await db
    .select()
    .from(workflowStates)
    .where(eq(workflowStates.id, workflowId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return toWorkflowRecord(result[0]);
}

/**
 * Get the current active workflow for a session using session.currentWorkflowId
 */
export async function getCurrentWorkflow(
  sessionId: string
): Promise<WorkflowStateRecord | null> {
  if (!sessionId || !sessionId.trim()) {
    return null;
  }

  // Get the session's currentWorkflowId
  const sessionResult = await db
    .select({ currentWorkflowId: sessions.currentWorkflowId })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (sessionResult.length === 0 || !sessionResult[0].currentWorkflowId) {
    return null;
  }

  const workflowId = sessionResult[0].currentWorkflowId;
  return getWorkflow(workflowId);
}

/**
 * Transition a workflow to a new state with optional context updates.
 * Validates the transition using the state machine.
 */
export async function transitionState(
  workflowId: string,
  newState: WorkflowState,
  contextUpdates: Partial<WorkflowContext> = {}
): Promise<WorkflowStateRecord> {
  const workflow = await getWorkflow(workflowId);
  if (!workflow) {
    throw new WorkflowNotFoundError(workflowId);
  }

  // Merge context updates
  const mergedContext: WorkflowContext = {
    ...workflow.context,
    ...contextUpdates,
  };

  // Validate the transition with context
  const validationResult = bookingStateMachine.canTransitionWithContext(
    workflow.currentState,
    newState,
    mergedContext
  );

  if (!validationResult.canTransition) {
    throw new InvalidTransitionError(
      workflow.currentState,
      newState,
      validationResult.reason
    );
  }

  const now = new Date();

  await db
    .update(workflowStates)
    .set({
      currentState: newState,
      context: mergedContext,
      lastUpdated: now,
    })
    .where(eq(workflowStates.id, workflowId));

  logger.info('Workflow state transitioned', {
    workflowId,
    from: workflow.currentState,
    to: newState,
    contextUpdates,
  });

  return {
    ...workflow,
    currentState: newState,
    context: mergedContext,
    lastUpdated: now,
  };
}

/**
 * Update workflow context without changing state
 */
export async function updateContext(
  workflowId: string,
  contextUpdates: Partial<WorkflowContext>
): Promise<WorkflowStateRecord> {
  const workflow = await getWorkflow(workflowId);
  if (!workflow) {
    throw new WorkflowNotFoundError(workflowId);
  }

  const mergedContext: WorkflowContext = {
    ...workflow.context,
    ...contextUpdates,
  };

  const now = new Date();

  await db
    .update(workflowStates)
    .set({
      context: mergedContext,
      lastUpdated: now,
    })
    .where(eq(workflowStates.id, workflowId));

  logger.debug('Workflow context updated', {
    workflowId,
    contextUpdates,
  });

  return {
    ...workflow,
    context: mergedContext,
    lastUpdated: now,
  };
}

/**
 * Delete a workflow (useful for testing)
 */
export async function deleteWorkflow(workflowId: string): Promise<boolean> {
  if (!workflowId || !workflowId.trim()) {
    return false;
  }

  const result = await db
    .delete(workflowStates)
    .where(eq(workflowStates.id, workflowId));

  return result.changes > 0;
}
