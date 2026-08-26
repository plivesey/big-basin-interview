import { create } from 'zustand';
import type { SessionListItem } from '@asba/shared-types';
import { listSessions } from '../api/sessions';
import { getCalendarStatus, disconnectCalendar } from '../api/calendar';
import { logger } from '../utils/logger';

// Menu store state for hamburger menu and calendar connection
export interface MenuState {
  // Menu state
  isMenuOpen: boolean;

  // Calendar connection state
  calendarConnected: boolean;
  calendarEmail: string | null;
  isLoadingCalendarStatus: boolean;

  // Conversation history state
  sessions: SessionListItem[];
  isLoadingSessions: boolean;
  currentSessionId: string | null;

  // Actions
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  setCalendarStatus: (connected: boolean, email: string | null) => void;
  setLoadingCalendarStatus: (loading: boolean) => void;
  fetchSessions: () => Promise<void>;
  fetchCalendarStatus: () => Promise<void>;
  disconnectCalendar: () => Promise<void>;
  setCurrentSessionId: (id: string | null) => void;
  addSession: (session: SessionListItem) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  isMenuOpen: false,
  calendarConnected: false,
  calendarEmail: null as string | null,
  isLoadingCalendarStatus: false,
  sessions: [] as SessionListItem[],
  isLoadingSessions: false,
  currentSessionId: null as string | null,
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

  setLoadingCalendarStatus: (loading: boolean) => set({ isLoadingCalendarStatus: loading }),

  fetchSessions: async () => {
    set({ isLoadingSessions: true });
    try {
      const sessions = await listSessions();
      set({ sessions, isLoadingSessions: false });
    } catch (error) {
      logger.warn('Failed to load sessions', { error: String(error) });
      set({ isLoadingSessions: false });
    }
  },

  fetchCalendarStatus: async () => {
    set({ isLoadingCalendarStatus: true });
    try {
      const status = await getCalendarStatus();
      set({
        calendarConnected: status.connected,
        calendarEmail: status.email,
        isLoadingCalendarStatus: false,
      });
    } catch (error) {
      logger.warn('Failed to load calendar status', { error: String(error) });
      set({ isLoadingCalendarStatus: false });
    }
  },

  disconnectCalendar: async () => {
    try {
      await disconnectCalendar();
      set({ calendarConnected: false, calendarEmail: null });
    } catch (error) {
      logger.warn('Failed to disconnect calendar', { error: String(error) });
    }
  },

  setCurrentSessionId: (id: string | null) => set({ currentSessionId: id }),

  addSession: (session: SessionListItem) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
    })),

  reset: () => set(initialState),
}));

// Selectors for optimized subscriptions
export const selectIsMenuOpen = (state: MenuState) => state.isMenuOpen;
export const selectCalendarConnected = (state: MenuState) => state.calendarConnected;
export const selectCalendarEmail = (state: MenuState) => state.calendarEmail;
export const selectIsLoadingCalendarStatus = (state: MenuState) => state.isLoadingCalendarStatus;
export const selectSessions = (state: MenuState) => state.sessions;
export const selectIsLoadingSessions = (state: MenuState) => state.isLoadingSessions;
export const selectCurrentSessionId = (state: MenuState) => state.currentSessionId;
