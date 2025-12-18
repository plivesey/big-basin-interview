/**
 * Workflow types for the booking state machine
 */

export enum WorkflowState {
  PROVIDER_SEARCH = 'PROVIDER_SEARCH',
  PROVIDER_SELECTION = 'PROVIDER_SELECTION',
  COMPLETE = 'COMPLETE',
}

export interface WorkflowContext {
  serviceType?: string;
  location?: string;
  timePreference?: string;
  selectedProviderId?: string;
  selectedProviders?: string[]; // IDs of search results
  selectedTimeSlot?: string; // ISO date string
  bookingId?: string;
}

export interface WorkflowStateRecord {
  id: string; // Unique workflow ID
  sessionId: string; // Session this workflow belongs to
  currentState: WorkflowState; // Current state in the state machine
  context: WorkflowContext;
  createdAt: Date;
  lastUpdated: Date;
  completedAt?: Date;
}

// Valid state transitions
export const VALID_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  [WorkflowState.PROVIDER_SEARCH]: [WorkflowState.PROVIDER_SELECTION],
  [WorkflowState.PROVIDER_SELECTION]: [WorkflowState.PROVIDER_SELECTION, WorkflowState.COMPLETE, WorkflowState.PROVIDER_SEARCH],
  [WorkflowState.COMPLETE]: [], // Terminal state
};

export function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStates(current: WorkflowState): WorkflowState[] {
  return VALID_TRANSITIONS[current] ?? [];
}
