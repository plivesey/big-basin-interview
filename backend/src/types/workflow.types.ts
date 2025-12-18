/**
 * Workflow types for the booking state machine
 */

export enum WorkflowState {
  PROVIDER_SEARCH = 'PROVIDER_SEARCH',
  PROVIDER_SELECTION = 'PROVIDER_SELECTION',
  TIME_SELECTION = 'TIME_SELECTION',
  CONFIRMATION = 'CONFIRMATION',
  BOOKING_CREATED = 'BOOKING_CREATED',
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
  [WorkflowState.PROVIDER_SELECTION]: [WorkflowState.TIME_SELECTION, WorkflowState.PROVIDER_SEARCH],
  [WorkflowState.TIME_SELECTION]: [WorkflowState.CONFIRMATION, WorkflowState.PROVIDER_SELECTION],
  [WorkflowState.CONFIRMATION]: [WorkflowState.BOOKING_CREATED, WorkflowState.TIME_SELECTION],
  [WorkflowState.BOOKING_CREATED]: [WorkflowState.COMPLETE],
  [WorkflowState.COMPLETE]: [], // Terminal state
};

export function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStates(current: WorkflowState): WorkflowState[] {
  return VALID_TRANSITIONS[current] ?? [];
}
