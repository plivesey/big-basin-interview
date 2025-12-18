import { create } from 'zustand';

// Menu store state for hamburger menu and calendar connection
export interface MenuState {
  // Menu state
  isMenuOpen: boolean;

  // Calendar connection state
  calendarConnected: boolean;
  calendarEmail: string | null;
  isLoadingCalendarStatus: boolean;

  // Actions
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  setCalendarStatus: (connected: boolean, email: string | null) => void;
  setLoadingCalendarStatus: (loading: boolean) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  isMenuOpen: false,
  calendarConnected: false,
  calendarEmail: null as string | null,
  isLoadingCalendarStatus: false,
};

// Create the store
export const useMenuStore = create<MenuState>((set) => ({
  ...initialState,

  openMenu: () => set({ isMenuOpen: true }),

  closeMenu: () => set({ isMenuOpen: false }),

  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),

  setCalendarStatus: (connected: boolean, email: string | null) =>
    set({
      calendarConnected: connected,
      calendarEmail: email,
      isLoadingCalendarStatus: false,
    }),

  setLoadingCalendarStatus: (loading: boolean) =>
    set({ isLoadingCalendarStatus: loading }),

  reset: () => set(initialState),
}));

// Selectors for optimized subscriptions
export const selectIsMenuOpen = (state: MenuState) => state.isMenuOpen;
export const selectCalendarConnected = (state: MenuState) => state.calendarConnected;
export const selectCalendarEmail = (state: MenuState) => state.calendarEmail;
export const selectIsLoadingCalendarStatus = (state: MenuState) => state.isLoadingCalendarStatus;
