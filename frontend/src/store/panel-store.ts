import { create } from 'zustand';

// Provider data for display (matches backend DisplayProvider)
export interface DisplayProvider {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number | null;
  services: string[];
  address: string;
}

// Panel store state
export interface PanelState {
  // Provider panel state
  isProviderPanelOpen: boolean;
  displayedProviders: DisplayProvider[];

  // Actions
  openProviderPanel: (providers: DisplayProvider[]) => void;
  closeProviderPanel: () => void;
  updateProviders: (providers: DisplayProvider[]) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  isProviderPanelOpen: false,
  displayedProviders: [],
};

// Create the store
export const usePanelStore = create<PanelState>((set) => ({
  ...initialState,

  openProviderPanel: (providers: DisplayProvider[]) =>
    set({
      isProviderPanelOpen: true,
      displayedProviders: providers,
    }),

  closeProviderPanel: () =>
    set({
      isProviderPanelOpen: false,
      displayedProviders: [],
    }),

  updateProviders: (providers: DisplayProvider[]) =>
    set({
      displayedProviders: providers,
      isProviderPanelOpen: providers.length > 0,
    }),

  reset: () => set(initialState),
}));
