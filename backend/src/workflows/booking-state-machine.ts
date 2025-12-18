/**
 * Booking State Machine
 *
 * Wraps the workflow type utilities and adds business logic for:
 * - Required context fields per state
 * - Context validation
 * - Terminal state detection
 */

import {
  WorkflowState,
  WorkflowContext,
  canTransition,
  getNextStates,
} from '../types/workflow.types';

/**
 * Required context fields for each workflow state.
 * These must be present in the workflow context before transitioning to the state.
 */
const REQUIRED_CONTEXT: Record<WorkflowState, (keyof WorkflowContext)[]> = {
  [WorkflowState.PROVIDER_SEARCH]: [],
  [WorkflowState.PROVIDER_SELECTION]: ['selectedProviderId'],
  [WorkflowState.COMPLETE]: ['bookingId'],
};

/**
 * Booking State Machine class that provides state machine operations
 * with business logic validation.
 */
export const bookingStateMachine = {
  /**
   * Get the initial state for a new workflow
   */
  getInitialState(): WorkflowState {
    return WorkflowState.PROVIDER_SEARCH;
  },

  /**
   * Check if a transition from one state to another is valid
   */
  isValidTransition(from: WorkflowState, to: WorkflowState): boolean {
    return canTransition(from, to);
  },

  /**
   * Get all valid next states from the current state
   */
  getValidTransitions(from: WorkflowState): WorkflowState[] {
    return getNextStates(from);
  },

  /**
   * Check if a state is a terminal state (no further transitions allowed)
   */
  isTerminalState(state: WorkflowState): boolean {
    return state === WorkflowState.COMPLETE;
  },

  /**
   * Get the required context fields for a given state
   */
  getRequiredContext(state: WorkflowState): (keyof WorkflowContext)[] {
    return REQUIRED_CONTEXT[state] ?? [];
  },

  /**
   * Validate that the context has all required fields for a given state
   * @returns An object with `valid` boolean and `missingFields` array if invalid
   */
  validateContextForState(
    state: WorkflowState,
    context: WorkflowContext
  ): { valid: true } | { valid: false; missingFields: string[] } {
    const requiredFields = REQUIRED_CONTEXT[state] ?? [];
    const missingFields = requiredFields.filter(
      (field) => context[field] === undefined || context[field] === null
    );

    if (missingFields.length === 0) {
      return { valid: true };
    }

    return { valid: false, missingFields };
  },

  /**
   * Check if a transition is valid considering both the state machine rules
   * and the context requirements for the target state.
   */
  canTransitionWithContext(
    from: WorkflowState,
    to: WorkflowState,
    context: WorkflowContext
  ): { canTransition: true } | { canTransition: false; reason: string } {
    // First check if the state transition is valid
    if (!canTransition(from, to)) {
      return {
        canTransition: false,
        reason: `Invalid transition from ${from} to ${to}`,
      };
    }

    // Then check if context has required fields for target state
    const contextValidation = this.validateContextForState(to, context);
    if (!contextValidation.valid) {
      return {
        canTransition: false,
        reason: `Missing required context fields: ${contextValidation.missingFields.join(', ')}`,
      };
    }

    return { canTransition: true };
  },
};

export type BookingStateMachine = typeof bookingStateMachine;
