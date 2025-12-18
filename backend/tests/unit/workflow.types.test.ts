import { describe, it, expect } from 'vitest';
import {
  WorkflowState,
  canTransition,
  getNextStates,
  VALID_TRANSITIONS,
} from '../../src/types/workflow.types';

describe('Workflow Types', () => {
  describe('WorkflowState enum', () => {
    it('should define all workflow states', () => {
      expect(WorkflowState.PROVIDER_SEARCH).toBe('PROVIDER_SEARCH');
      expect(WorkflowState.PROVIDER_SELECTION).toBe('PROVIDER_SELECTION');
      expect(WorkflowState.COMPLETE).toBe('COMPLETE');
    });
  });

  describe('VALID_TRANSITIONS', () => {
    it('should define valid transitions from PROVIDER_SEARCH', () => {
      expect(VALID_TRANSITIONS[WorkflowState.PROVIDER_SEARCH]).toContain(WorkflowState.PROVIDER_SELECTION);
    });

    it('should define valid transitions from PROVIDER_SELECTION', () => {
      expect(VALID_TRANSITIONS[WorkflowState.PROVIDER_SELECTION]).toContain(WorkflowState.COMPLETE);
      expect(VALID_TRANSITIONS[WorkflowState.PROVIDER_SELECTION]).toContain(WorkflowState.PROVIDER_SEARCH);
      expect(VALID_TRANSITIONS[WorkflowState.PROVIDER_SELECTION]).toContain(WorkflowState.PROVIDER_SELECTION);
    });

    it('should define COMPLETE as terminal state with no transitions', () => {
      expect(VALID_TRANSITIONS[WorkflowState.COMPLETE]).toEqual([]);
    });
  });

  describe('canTransition', () => {
    it('should return true for valid forward transitions', () => {
      expect(canTransition(WorkflowState.PROVIDER_SEARCH, WorkflowState.PROVIDER_SELECTION)).toBe(true);
      expect(canTransition(WorkflowState.PROVIDER_SELECTION, WorkflowState.COMPLETE)).toBe(true);
    });

    it('should return true for valid backward transitions', () => {
      expect(canTransition(WorkflowState.PROVIDER_SELECTION, WorkflowState.PROVIDER_SEARCH)).toBe(true);
    });

    it('should return true for self-transition in PROVIDER_SELECTION', () => {
      expect(canTransition(WorkflowState.PROVIDER_SELECTION, WorkflowState.PROVIDER_SELECTION)).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(canTransition(WorkflowState.PROVIDER_SEARCH, WorkflowState.COMPLETE)).toBe(false);
      expect(canTransition(WorkflowState.COMPLETE, WorkflowState.PROVIDER_SEARCH)).toBe(false);
    });

    it('should return false for self-transitions except PROVIDER_SELECTION', () => {
      expect(canTransition(WorkflowState.PROVIDER_SEARCH, WorkflowState.PROVIDER_SEARCH)).toBe(false);
      expect(canTransition(WorkflowState.COMPLETE, WorkflowState.COMPLETE)).toBe(false);
    });
  });

  describe('getNextStates', () => {
    it('should return valid next states for PROVIDER_SEARCH', () => {
      expect(getNextStates(WorkflowState.PROVIDER_SEARCH)).toEqual([WorkflowState.PROVIDER_SELECTION]);
    });

    it('should return multiple options for PROVIDER_SELECTION', () => {
      const nextFromSelection = getNextStates(WorkflowState.PROVIDER_SELECTION);
      expect(nextFromSelection).toContain(WorkflowState.PROVIDER_SELECTION);
      expect(nextFromSelection).toContain(WorkflowState.COMPLETE);
      expect(nextFromSelection).toContain(WorkflowState.PROVIDER_SEARCH);
    });

    it('should return empty array for terminal state', () => {
      expect(getNextStates(WorkflowState.COMPLETE)).toEqual([]);
    });
  });
});
