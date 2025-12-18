import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorkflow,
  getWorkflow,
  getCurrentWorkflow,
  transitionState,
  updateContext,
  completeWorkflow,
  abandonWorkflow,
  deleteWorkflow,
  WorkflowNotFoundError,
  InvalidTransitionError,
  WorkflowState,
  WorkflowStatus,
} from '../../src/services/workflow-service';
import { createSession, deleteSession } from '../../src/services/session-service';

describe('Workflow Service', () => {
  let sessionId: string;

  beforeEach(async () => {
    // Create a session for each test
    const session = await createSession();
    sessionId = session.id;
  });

  describe('createWorkflow', () => {
    it('should create a new workflow with PROVIDER_SEARCH state', async () => {
      const workflow = await createWorkflow(sessionId);

      expect(workflow).toBeDefined();
      expect(workflow.id).toBeDefined();
      expect(workflow.sessionId).toBe(sessionId);
      expect(workflow.currentState).toBe(WorkflowState.PROVIDER_SEARCH);
      expect(workflow.status).toBe(WorkflowStatus.ACTIVE);
    });

    it('should create workflow with initial context', async () => {
      const workflow = await createWorkflow(sessionId, { serviceType: 'salon' });

      expect(workflow.context.serviceType).toBe('salon');
    });

    it('should update session.currentWorkflowId', async () => {
      const workflow = await createWorkflow(sessionId);
      const currentWorkflow = await getCurrentWorkflow(sessionId);

      expect(currentWorkflow).toBeDefined();
      expect(currentWorkflow?.id).toBe(workflow.id);
    });

    it('should abandon previous workflow when creating new one', async () => {
      // Create first workflow
      const firstWorkflow = await createWorkflow(sessionId, { serviceType: 'salon' });

      // Create second workflow
      const secondWorkflow = await createWorkflow(sessionId, { serviceType: 'mechanic' });

      // Get first workflow and check it's abandoned
      const firstUpdated = await getWorkflow(firstWorkflow.id);
      expect(firstUpdated?.status).toBe(WorkflowStatus.ABANDONED);

      // Second workflow should be active
      expect(secondWorkflow.status).toBe(WorkflowStatus.ACTIVE);
    });
  });

  describe('getWorkflow', () => {
    it('should return workflow by ID', async () => {
      const created = await createWorkflow(sessionId);
      const retrieved = await getWorkflow(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent ID', async () => {
      const result = await getWorkflow('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return null for empty/invalid ID', async () => {
      expect(await getWorkflow('')).toBeNull();
      expect(await getWorkflow('  ')).toBeNull();
    });
  });

  describe('getCurrentWorkflow', () => {
    it('should return current workflow from session.currentWorkflowId', async () => {
      const created = await createWorkflow(sessionId);
      const current = await getCurrentWorkflow(sessionId);

      expect(current).toBeDefined();
      expect(current?.id).toBe(created.id);
    });

    it('should return null if no current workflow', async () => {
      const result = await getCurrentWorkflow(sessionId);
      expect(result).toBeNull();
    });

    it('should return null for invalid session ID', async () => {
      expect(await getCurrentWorkflow('')).toBeNull();
      expect(await getCurrentWorkflow('non-existent')).toBeNull();
    });
  });

  describe('transitionState', () => {
    it('should transition state and update lastUpdated', async () => {
      const workflow = await createWorkflow(sessionId);
      const originalLastUpdated = workflow.lastUpdated;

      // Wait a tiny bit to ensure time difference
      await new Promise((r) => setTimeout(r, 10));

      const updated = await transitionState(
        workflow.id,
        WorkflowState.PROVIDER_SELECTION
      );

      expect(updated.currentState).toBe(WorkflowState.PROVIDER_SELECTION);
      expect(updated.lastUpdated.getTime()).toBeGreaterThanOrEqual(originalLastUpdated.getTime());
    });

    it('should merge context updates on transition', async () => {
      const workflow = await createWorkflow(sessionId, { serviceType: 'salon' });

      const updated = await transitionState(
        workflow.id,
        WorkflowState.PROVIDER_SELECTION,
        { selectedProviders: ['p1', 'p2'] }
      );

      expect(updated.context.serviceType).toBe('salon');
      expect(updated.context.selectedProviders).toEqual(['p1', 'p2']);
    });

    it('should throw InvalidTransitionError for invalid transitions', async () => {
      const workflow = await createWorkflow(sessionId);

      await expect(
        transitionState(workflow.id, WorkflowState.COMPLETE)
      ).rejects.toThrow(InvalidTransitionError);
    });

    it('should throw WorkflowNotFoundError for non-existent workflow', async () => {
      await expect(
        transitionState('non-existent', WorkflowState.PROVIDER_SELECTION)
      ).rejects.toThrow(WorkflowNotFoundError);
    });

    it('should validate required context fields for target state', async () => {
      const workflow = await createWorkflow(sessionId);
      await transitionState(workflow.id, WorkflowState.PROVIDER_SELECTION);

      // TIME_SELECTION requires selectedProviderId
      await expect(
        transitionState(workflow.id, WorkflowState.TIME_SELECTION)
      ).rejects.toThrow(InvalidTransitionError);
    });

    it('should allow transition when required context is provided', async () => {
      const workflow = await createWorkflow(sessionId);
      await transitionState(workflow.id, WorkflowState.PROVIDER_SELECTION);

      const updated = await transitionState(
        workflow.id,
        WorkflowState.TIME_SELECTION,
        { selectedProviderId: 'provider-123' }
      );

      expect(updated.currentState).toBe(WorkflowState.TIME_SELECTION);
      expect(updated.context.selectedProviderId).toBe('provider-123');
    });
  });

  describe('updateContext', () => {
    it('should merge new context with existing', async () => {
      const workflow = await createWorkflow(sessionId, {
        serviceType: 'salon',
        location: 'downtown',
      });

      const updated = await updateContext(workflow.id, {
        selectedProviders: ['p1', 'p2'],
      });

      expect(updated.context.serviceType).toBe('salon');
      expect(updated.context.location).toBe('downtown');
      expect(updated.context.selectedProviders).toEqual(['p1', 'p2']);
    });

    it('should throw WorkflowNotFoundError for non-existent workflow', async () => {
      await expect(
        updateContext('non-existent', { serviceType: 'salon' })
      ).rejects.toThrow(WorkflowNotFoundError);
    });
  });

  describe('completeWorkflow', () => {
    it('should set status to COMPLETED and set completedAt', async () => {
      const workflow = await createWorkflow(sessionId);

      const completed = await completeWorkflow(workflow.id);

      expect(completed.status).toBe(WorkflowStatus.COMPLETED);
      expect(completed.completedAt).toBeDefined();
    });

    it('should throw WorkflowNotFoundError for non-existent workflow', async () => {
      await expect(completeWorkflow('non-existent')).rejects.toThrow(
        WorkflowNotFoundError
      );
    });
  });

  describe('abandonWorkflow', () => {
    it('should set status to ABANDONED', async () => {
      const workflow = await createWorkflow(sessionId);

      const abandoned = await abandonWorkflow(workflow.id);

      expect(abandoned.status).toBe(WorkflowStatus.ABANDONED);
    });

    it('should throw WorkflowNotFoundError for non-existent workflow', async () => {
      await expect(abandonWorkflow('non-existent')).rejects.toThrow(
        WorkflowNotFoundError
      );
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete workflow and return true', async () => {
      const workflow = await createWorkflow(sessionId);

      const result = await deleteWorkflow(workflow.id);
      expect(result).toBe(true);

      const retrieved = await getWorkflow(workflow.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent workflow', async () => {
      const result = await deleteWorkflow('non-existent');
      expect(result).toBe(false);
    });
  });
});
