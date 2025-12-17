import { describe, it, expect } from 'vitest';
import {
  WorkflowState,
  WorkflowStatus,
  canTransition,
  getNextStates,
  VALID_TRANSITIONS,
} from '../../src/types/workflow.types';

describe('Workflow Types', () => {
  describe('WorkflowState enum', () => {
    it('should define all workflow states', () => {
      expect(WorkflowState.PROVIDER_SEARCH).toBe('PROVIDER_SEARCH');
      expect(WorkflowState.PROVIDER_SELECTION).toBe('PROVIDER_SELECTION');
      expect(WorkflowState.TIME_SELECTION).toBe('TIME_SELECTION');
      expect(WorkflowState.CONFIRMATION).toBe('CONFIRMATION');
      expect(WorkflowState.BOOKING_CREATED).toBe('BOOKING_CREATED');
      expect(WorkflowState.COMPLETE).toBe('COMPLETE');
    });
  });

  describe('WorkflowStatus enum', () => {
    it('should define all workflow statuses', () => {
      expect(WorkflowStatus.ACTIVE).toBe('active');
      expect(WorkflowStatus.COMPLETED).toBe('completed');
      expect(WorkflowStatus.ABANDONED).toBe('abandoned');
    });
  });

  describe('VALID_TRANSITIONS', () => {
    it('should define valid transitions from PROVIDER_SEARCH', () => {
      expect(VALID_TRANSITIONS[WorkflowState.PROVIDER_SEARCH]).toContain(WorkflowState.PROVIDER_SELECTION);
    });

    it('should define valid transitions from PROVIDER_SELECTION', () => {
      expect(VALID_TRANSITIONS[WorkflowState.PROVIDER_SELECTION]).toContain(WorkflowState.TIME_SELECTION);
      expect(VALID_TRANSITIONS[WorkflowState.PROVIDER_SELECTION]).toContain(WorkflowState.PROVIDER_SEARCH);
    });

    it('should define valid transitions from TIME_SELECTION', () => {
      expect(VALID_TRANSITIONS[WorkflowState.TIME_SELECTION]).toContain(WorkflowState.CONFIRMATION);
      expect(VALID_TRANSITIONS[WorkflowState.TIME_SELECTION]).toContain(WorkflowState.PROVIDER_SELECTION);
    });

    it('should define valid transitions from CONFIRMATION', () => {
      expect(VALID_TRANSITIONS[WorkflowState.CONFIRMATION]).toContain(WorkflowState.BOOKING_CREATED);
      expect(VALID_TRANSITIONS[WorkflowState.CONFIRMATION]).toContain(WorkflowState.TIME_SELECTION);
    });

    it('should define valid transitions from BOOKING_CREATED', () => {
      expect(VALID_TRANSITIONS[WorkflowState.BOOKING_CREATED]).toContain(WorkflowState.COMPLETE);
    });

    it('should define COMPLETE as terminal state with no transitions', () => {
      expect(VALID_TRANSITIONS[WorkflowState.COMPLETE]).toEqual([]);
    });
  });

  describe('canTransition', () => {
    it('should return true for valid forward transitions', () => {
      expect(canTransition(WorkflowState.PROVIDER_SEARCH, WorkflowState.PROVIDER_SELECTION)).toBe(true);
      expect(canTransition(WorkflowState.PROVIDER_SELECTION, WorkflowState.TIME_SELECTION)).toBe(true);
      expect(canTransition(WorkflowState.TIME_SELECTION, WorkflowState.CONFIRMATION)).toBe(true);
      expect(canTransition(WorkflowState.CONFIRMATION, WorkflowState.BOOKING_CREATED)).toBe(true);
      expect(canTransition(WorkflowState.BOOKING_CREATED, WorkflowState.COMPLETE)).toBe(true);
    });

    it('should return true for valid backward transitions', () => {
      expect(canTransition(WorkflowState.PROVIDER_SELECTION, WorkflowState.PROVIDER_SEARCH)).toBe(true);
      expect(canTransition(WorkflowState.TIME_SELECTION, WorkflowState.PROVIDER_SELECTION)).toBe(true);
      expect(canTransition(WorkflowState.CONFIRMATION, WorkflowState.TIME_SELECTION)).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(canTransition(WorkflowState.PROVIDER_SEARCH, WorkflowState.COMPLETE)).toBe(false);
      expect(canTransition(WorkflowState.PROVIDER_SEARCH, WorkflowState.BOOKING_CREATED)).toBe(false);
      expect(canTransition(WorkflowState.COMPLETE, WorkflowState.PROVIDER_SEARCH)).toBe(false);
    });

    it('should return false for self-transitions', () => {
      expect(canTransition(WorkflowState.PROVIDER_SEARCH, WorkflowState.PROVIDER_SEARCH)).toBe(false);
      expect(canTransition(WorkflowState.COMPLETE, WorkflowState.COMPLETE)).toBe(false);
    });

    it('should return false for skipping states', () => {
      expect(canTransition(WorkflowState.PROVIDER_SEARCH, WorkflowState.CONFIRMATION)).toBe(false);
      expect(canTransition(WorkflowState.PROVIDER_SELECTION, WorkflowState.BOOKING_CREATED)).toBe(false);
    });
  });

  describe('getNextStates', () => {
    it('should return valid next states for each state', () => {
      expect(getNextStates(WorkflowState.PROVIDER_SEARCH)).toEqual([WorkflowState.PROVIDER_SELECTION]);
      expect(getNextStates(WorkflowState.BOOKING_CREATED)).toEqual([WorkflowState.COMPLETE]);
    });

    it('should return empty array for terminal state', () => {
      expect(getNextStates(WorkflowState.COMPLETE)).toEqual([]);
    });

    it('should return multiple options for states with choices', () => {
      const nextFromSelection = getNextStates(WorkflowState.PROVIDER_SELECTION);
      expect(nextFromSelection).toContain(WorkflowState.TIME_SELECTION);
      expect(nextFromSelection).toContain(WorkflowState.PROVIDER_SEARCH);
    });
  });
});
