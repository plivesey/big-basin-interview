import { create } from 'zustand';
import type { DisplayProvider, WorkflowState } from '@asba/shared-types';

// Re-export for consumers
export type { DisplayProvider, WorkflowState } from '@asba/shared-types';

// Panel store state
export interface PanelState {
  // Provider panel state
  isProviderPanelOpen: boolean;
  displayedProviders: DisplayProvider[];
  activeWorkflowId: string | null;
  workflowState: WorkflowState | null;

  // Actions
  openProviderPanel: (
    providers: DisplayProvider[],
    workflowId?: string,
    workflowState?: WorkflowState
  ) => void;
  closeProviderPanel: () => void;
  reopenProviderPanel: () => void;
  updateProviders: (providers: DisplayProvider[]) => void;
  setActiveWorkflowId: (workflowId: string | null) => void;
  setWorkflowState: (state: WorkflowState | null) => void;
  clearProviders: () => void;
  reset: () => void;
}

// Initial state
const initialState = {
  isProviderPanelOpen: false,
  displayedProviders: [] as DisplayProvider[],
  activeWorkflowId: null as string | null,
  workflowState: null as WorkflowState | null,
};

// Create the store
export const usePanelStore = create<PanelState>((set) => ({
  ...initialState,

  openProviderPanel: (
    providers: DisplayProvider[],
    workflowId?: string,
    workflowState?: WorkflowState
  ) =>
    set({
      isProviderPanelOpen: true,
      displayedProviders: providers,
      activeWorkflowId: workflowId ?? null,
      workflowState: workflowState ?? null,
    }),

  // Close panel but preserve providers so toggle button can re-open
  closeProviderPanel: () =>
    set({
      isProviderPanelOpen: false,
    }),

  // Re-open panel with existing providers (for toggle button)
  reopenProviderPanel: () =>
    set({
      isProviderPanelOpen: true,
    }),

  updateProviders: (providers: DisplayProvider[]) =>
    set({
      displayedProviders: providers,
      isProviderPanelOpen: providers.length > 0,
    }),

  setActiveWorkflowId: (workflowId: string | null) =>
    set({
      activeWorkflowId: workflowId,
    }),

  setWorkflowState: (state: WorkflowState | null) =>
    set({
      workflowState: state,
    }),

  // Clear providers when workflow completes
  clearProviders: () =>
    set({
      displayedProviders: [],
      workflowState: null,
      isProviderPanelOpen: false,
    }),

  reset: () => set(initialState),
}));
