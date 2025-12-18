import { describe, it, expect } from 'vitest';
import { bookingStateMachine } from '../../src/workflows/booking-state-machine';
import { WorkflowState, WorkflowContext } from '../../src/types/workflow.types';

describe('Booking State Machine', () => {
  describe('getInitialState', () => {
    it('should return PROVIDER_SEARCH as the initial state', () => {
      expect(bookingStateMachine.getInitialState()).toBe(WorkflowState.PROVIDER_SEARCH);
    });
  });

  describe('isValidTransition', () => {
    it('should return true for valid forward transitions', () => {
      expect(bookingStateMachine.isValidTransition(
        WorkflowState.PROVIDER_SEARCH,
        WorkflowState.PROVIDER_SELECTION
      )).toBe(true);
      expect(bookingStateMachine.isValidTransition(
        WorkflowState.PROVIDER_SELECTION,
        WorkflowState.TIME_SELECTION
      )).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(bookingStateMachine.isValidTransition(
        WorkflowState.PROVIDER_SEARCH,
        WorkflowState.COMPLETE
      )).toBe(false);
      expect(bookingStateMachine.isValidTransition(
        WorkflowState.PROVIDER_SEARCH,
        WorkflowState.CONFIRMATION
      )).toBe(false);
    });
  });

  describe('getValidTransitions', () => {
    it('should return correct next states for each state', () => {
      expect(bookingStateMachine.getValidTransitions(WorkflowState.PROVIDER_SEARCH))
        .toEqual([WorkflowState.PROVIDER_SELECTION]);

      const fromSelection = bookingStateMachine.getValidTransitions(WorkflowState.PROVIDER_SELECTION);
      expect(fromSelection).toContain(WorkflowState.TIME_SELECTION);
      expect(fromSelection).toContain(WorkflowState.PROVIDER_SEARCH);
    });

    it('should return empty array for terminal state', () => {
      expect(bookingStateMachine.getValidTransitions(WorkflowState.COMPLETE)).toEqual([]);
    });
  });

  describe('isTerminalState', () => {
    it('should return true for COMPLETE state', () => {
      expect(bookingStateMachine.isTerminalState(WorkflowState.COMPLETE)).toBe(true);
    });

    it('should return false for non-terminal states', () => {
      expect(bookingStateMachine.isTerminalState(WorkflowState.PROVIDER_SEARCH)).toBe(false);
      expect(bookingStateMachine.isTerminalState(WorkflowState.BOOKING_CREATED)).toBe(false);
    });
  });

  describe('getRequiredContext', () => {
    it('should return empty array for initial states', () => {
      expect(bookingStateMachine.getRequiredContext(WorkflowState.PROVIDER_SEARCH)).toEqual([]);
      expect(bookingStateMachine.getRequiredContext(WorkflowState.PROVIDER_SELECTION)).toEqual([]);
    });

    it('should return selectedProviderId for TIME_SELECTION', () => {
      expect(bookingStateMachine.getRequiredContext(WorkflowState.TIME_SELECTION))
        .toContain('selectedProviderId');
    });

    it('should return selectedProviderId and selectedTimeSlot for CONFIRMATION', () => {
      const required = bookingStateMachine.getRequiredContext(WorkflowState.CONFIRMATION);
      expect(required).toContain('selectedProviderId');
      expect(required).toContain('selectedTimeSlot');
    });

    it('should return bookingId for BOOKING_CREATED', () => {
      const required = bookingStateMachine.getRequiredContext(WorkflowState.BOOKING_CREATED);
      expect(required).toContain('bookingId');
    });
  });

  describe('validateContextForState', () => {
    it('should validate successfully for states with no requirements', () => {
      const context: WorkflowContext = {};
      const result = bookingStateMachine.validateContextForState(
        WorkflowState.PROVIDER_SEARCH,
        context
      );
      expect(result.valid).toBe(true);
    });

    it('should fail validation for TIME_SELECTION without selectedProviderId', () => {
      const context: WorkflowContext = {};
      const result = bookingStateMachine.validateContextForState(
        WorkflowState.TIME_SELECTION,
        context
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.missingFields).toContain('selectedProviderId');
      }
    });

    it('should pass validation for TIME_SELECTION with selectedProviderId', () => {
      const context: WorkflowContext = { selectedProviderId: 'provider-123' };
      const result = bookingStateMachine.validateContextForState(
        WorkflowState.TIME_SELECTION,
        context
      );
      expect(result.valid).toBe(true);
    });

    it('should fail validation for CONFIRMATION without required fields', () => {
      const context: WorkflowContext = { selectedProviderId: 'provider-123' };
      const result = bookingStateMachine.validateContextForState(
        WorkflowState.CONFIRMATION,
        context
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.missingFields).toContain('selectedTimeSlot');
      }
    });

    it('should pass validation for CONFIRMATION with all required fields', () => {
      const context: WorkflowContext = {
        selectedProviderId: 'provider-123',
        selectedTimeSlot: '2024-01-15T10:00:00Z',
      };
      const result = bookingStateMachine.validateContextForState(
        WorkflowState.CONFIRMATION,
        context
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('canTransitionWithContext', () => {
    it('should allow transition when state and context are valid', () => {
      const context: WorkflowContext = { selectedProviderId: 'provider-123' };
      const result = bookingStateMachine.canTransitionWithContext(
        WorkflowState.PROVIDER_SELECTION,
        WorkflowState.TIME_SELECTION,
        context
      );
      expect(result.canTransition).toBe(true);
    });

    it('should reject transition when state is invalid', () => {
      const context: WorkflowContext = { selectedProviderId: 'provider-123' };
      const result = bookingStateMachine.canTransitionWithContext(
        WorkflowState.PROVIDER_SEARCH,
        WorkflowState.TIME_SELECTION,
        context
      );
      expect(result.canTransition).toBe(false);
      if (!result.canTransition) {
        expect(result.reason).toContain('Invalid transition');
      }
    });

    it('should reject transition when context is missing required fields', () => {
      const context: WorkflowContext = {};
      const result = bookingStateMachine.canTransitionWithContext(
        WorkflowState.PROVIDER_SELECTION,
        WorkflowState.TIME_SELECTION,
        context
      );
      expect(result.canTransition).toBe(false);
      if (!result.canTransition) {
        expect(result.reason).toContain('Missing required context');
      }
    });
  });
});
