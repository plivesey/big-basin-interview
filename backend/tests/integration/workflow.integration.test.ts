import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '../../src/db/schema';
import { WorkflowState, WorkflowStatus } from '../../src/types/workflow.types';

/**
 * Integration tests for workflow state persistence
 * These tests verify complete workflow operations against the database
 */
describe('Workflow Integration Tests', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    // Create in-memory database for testing
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    db = drizzle(sqlite, { schema });

    // Create all tables
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default_user',
        current_workflow_id TEXT,
        created_at INTEGER NOT NULL,
        last_activity_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workflow_states (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        current_state TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        context TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_updated INTEGER NOT NULL,
        completed_at INTEGER,
        expires_at INTEGER
      );

      CREATE INDEX IF NOT EXISTS workflow_session_id_idx ON workflow_states(session_id);
      CREATE INDEX IF NOT EXISTS workflow_status_idx ON workflow_states(status);
    `);
  });

  afterAll(() => {
    sqlite.close();
  });

  beforeEach(() => {
    // Clear tables between tests
    sqlite.exec('DELETE FROM workflow_states');
    sqlite.exec('DELETE FROM sessions');
  });

  describe('Workflow Persistence', () => {
    it('should create workflow and persist to database', async () => {
      const now = new Date();
      const sessionId = uuidv4();
      const workflowId = uuidv4();

      // Create session
      await db.insert(schema.sessions).values({
        id: sessionId,
        userId: 'test-user',
        currentWorkflowId: null,
        createdAt: now,
        lastActivityAt: now,
      });

      // Create workflow
      const workflowContext = { serviceType: 'salon' };
      await db.insert(schema.workflowStates).values({
        id: workflowId,
        sessionId,
        currentState: WorkflowState.PROVIDER_SEARCH,
        status: WorkflowStatus.ACTIVE,
        context: workflowContext,
        createdAt: now,
        lastUpdated: now,
        expiresAt: null,
      });

      // Update session's currentWorkflowId
      await db
        .update(schema.sessions)
        .set({ currentWorkflowId: workflowId })
        .where(eq(schema.sessions.id, sessionId));

      // Verify persistence
      const [workflow] = await db
        .select()
        .from(schema.workflowStates)
        .where(eq(schema.workflowStates.id, workflowId));

      expect(workflow).toBeDefined();
      expect(workflow.currentState).toBe(WorkflowState.PROVIDER_SEARCH);
      expect(workflow.status).toBe(WorkflowStatus.ACTIVE);
      expect(workflow.context).toEqual(workflowContext);

      // Verify session updated
      const [session] = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, sessionId));

      expect(session.currentWorkflowId).toBe(workflowId);
    });

    it('should persist state transitions correctly', async () => {
      const now = new Date();
      const sessionId = uuidv4();
      const workflowId = uuidv4();

      // Create session
      await db.insert(schema.sessions).values({
        id: sessionId,
        userId: 'test-user',
        currentWorkflowId: workflowId,
        createdAt: now,
        lastActivityAt: now,
      });

      // Create workflow in PROVIDER_SEARCH state
      await db.insert(schema.workflowStates).values({
        id: workflowId,
        sessionId,
        currentState: WorkflowState.PROVIDER_SEARCH,
        status: WorkflowStatus.ACTIVE,
        context: { serviceType: 'salon' },
        createdAt: now,
        lastUpdated: now,
        expiresAt: null,
      });

      // Transition to PROVIDER_SELECTION
      const transitionTime = new Date();
      await db
        .update(schema.workflowStates)
        .set({
          currentState: WorkflowState.PROVIDER_SELECTION,
          context: { serviceType: 'salon', selectedProviders: ['p1', 'p2'] },
          lastUpdated: transitionTime,
        })
        .where(eq(schema.workflowStates.id, workflowId));

      // Verify transition persisted
      const [workflow] = await db
        .select()
        .from(schema.workflowStates)
        .where(eq(schema.workflowStates.id, workflowId));

      expect(workflow.currentState).toBe(WorkflowState.PROVIDER_SELECTION);
      expect(workflow.context).toEqual({
        serviceType: 'salon',
        selectedProviders: ['p1', 'p2'],
      });
    });

    it('should update workflow status to completed', async () => {
      const now = new Date();
      const sessionId = uuidv4();
      const workflowId = uuidv4();

      // Create session and workflow
      await db.insert(schema.sessions).values({
        id: sessionId,
        userId: 'test-user',
        currentWorkflowId: workflowId,
        createdAt: now,
        lastActivityAt: now,
      });

      await db.insert(schema.workflowStates).values({
        id: workflowId,
        sessionId,
        currentState: WorkflowState.BOOKING_CREATED,
        status: WorkflowStatus.ACTIVE,
        context: { bookingId: 'booking-123' },
        createdAt: now,
        lastUpdated: now,
        expiresAt: null,
      });

      // Complete workflow
      const completedAt = new Date();
      await db
        .update(schema.workflowStates)
        .set({
          status: WorkflowStatus.COMPLETED,
          completedAt,
          lastUpdated: completedAt,
        })
        .where(eq(schema.workflowStates.id, workflowId));

      // Verify completion
      const [workflow] = await db
        .select()
        .from(schema.workflowStates)
        .where(eq(schema.workflowStates.id, workflowId));

      expect(workflow.status).toBe(WorkflowStatus.COMPLETED);
      expect(workflow.completedAt).toBeDefined();
    });

    it('should handle multiple workflows replacing previous ones', async () => {
      const now = new Date();
      const sessionId = uuidv4();
      const workflowId1 = uuidv4();
      const workflowId2 = uuidv4();

      // Create session
      await db.insert(schema.sessions).values({
        id: sessionId,
        userId: 'test-user',
        currentWorkflowId: null,
        createdAt: now,
        lastActivityAt: now,
      });

      // Create first workflow
      await db.insert(schema.workflowStates).values({
        id: workflowId1,
        sessionId,
        currentState: WorkflowState.PROVIDER_SELECTION,
        status: WorkflowStatus.ACTIVE,
        context: { serviceType: 'salon' },
        createdAt: now,
        lastUpdated: now,
        expiresAt: null,
      });

      await db
        .update(schema.sessions)
        .set({ currentWorkflowId: workflowId1 })
        .where(eq(schema.sessions.id, sessionId));

      // Abandon first workflow
      await db
        .update(schema.workflowStates)
        .set({ status: WorkflowStatus.ABANDONED })
        .where(eq(schema.workflowStates.id, workflowId1));

      // Create second workflow
      await db.insert(schema.workflowStates).values({
        id: workflowId2,
        sessionId,
        currentState: WorkflowState.PROVIDER_SEARCH,
        status: WorkflowStatus.ACTIVE,
        context: { serviceType: 'mechanic' },
        createdAt: now,
        lastUpdated: now,
        expiresAt: null,
      });

      await db
        .update(schema.sessions)
        .set({ currentWorkflowId: workflowId2 })
        .where(eq(schema.sessions.id, sessionId));

      // Verify first workflow is abandoned
      const [workflow1] = await db
        .select()
        .from(schema.workflowStates)
        .where(eq(schema.workflowStates.id, workflowId1));

      expect(workflow1.status).toBe(WorkflowStatus.ABANDONED);

      // Verify second workflow is active
      const [workflow2] = await db
        .select()
        .from(schema.workflowStates)
        .where(eq(schema.workflowStates.id, workflowId2));

      expect(workflow2.status).toBe(WorkflowStatus.ACTIVE);

      // Verify session points to second workflow
      const [session] = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, sessionId));

      expect(session.currentWorkflowId).toBe(workflowId2);
    });

    it('should persist context updates', async () => {
      const now = new Date();
      const sessionId = uuidv4();
      const workflowId = uuidv4();

      // Create session and workflow
      await db.insert(schema.sessions).values({
        id: sessionId,
        userId: 'test-user',
        currentWorkflowId: workflowId,
        createdAt: now,
        lastActivityAt: now,
      });

      await db.insert(schema.workflowStates).values({
        id: workflowId,
        sessionId,
        currentState: WorkflowState.TIME_SELECTION,
        status: WorkflowStatus.ACTIVE,
        context: { serviceType: 'salon', selectedProviderId: 'p1' },
        createdAt: now,
        lastUpdated: now,
        expiresAt: null,
      });

      // Update context
      await db
        .update(schema.workflowStates)
        .set({
          context: {
            serviceType: 'salon',
            selectedProviderId: 'p1',
            selectedTimeSlot: '2024-01-15T10:00:00Z',
          },
        })
        .where(eq(schema.workflowStates.id, workflowId));

      // Verify context updated
      const [workflow] = await db
        .select()
        .from(schema.workflowStates)
        .where(eq(schema.workflowStates.id, workflowId));

      expect(workflow.context).toEqual({
        serviceType: 'salon',
        selectedProviderId: 'p1',
        selectedTimeSlot: '2024-01-15T10:00:00Z',
      });
    });
  });
});
