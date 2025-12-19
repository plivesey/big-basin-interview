import { describe, it, expect, beforeEach } from 'vitest';
import {
  useMenuStore,
  selectIsMenuOpen,
  selectSessions,
  selectCurrentSessionId,
  selectIsLoadingSessions,
} from './menu-store';

describe('menu-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useMenuStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useMenuStore.getState();

      expect(state.isMenuOpen).toBe(false);
      expect(state.calendarConnected).toBe(false);
      expect(state.calendarEmail).toBeNull();
      expect(state.isLoadingCalendarStatus).toBe(false);
      expect(state.sessions).toEqual([]);
      expect(state.isLoadingSessions).toBe(false);
      expect(state.currentSessionId).toBeNull();
    });
  });

  describe('menu actions', () => {
    it('should open menu', () => {
      useMenuStore.getState().openMenu();
      expect(useMenuStore.getState().isMenuOpen).toBe(true);
    });

    it('should close menu', () => {
      useMenuStore.getState().openMenu();
      useMenuStore.getState().closeMenu();
      expect(useMenuStore.getState().isMenuOpen).toBe(false);
    });

    it('should toggle menu', () => {
      expect(useMenuStore.getState().isMenuOpen).toBe(false);
      useMenuStore.getState().toggleMenu();
      expect(useMenuStore.getState().isMenuOpen).toBe(true);
      useMenuStore.getState().toggleMenu();
      expect(useMenuStore.getState().isMenuOpen).toBe(false);
    });
  });

  describe('calendar actions', () => {
    it('should set calendar status', () => {
      useMenuStore.getState().setCalendarStatus(true, 'test@example.com');

      const state = useMenuStore.getState();
      expect(state.calendarConnected).toBe(true);
      expect(state.calendarEmail).toBe('test@example.com');
      expect(state.isLoadingCalendarStatus).toBe(false);
    });

    it('should set loading calendar status', () => {
      useMenuStore.getState().setLoadingCalendarStatus(true);
      expect(useMenuStore.getState().isLoadingCalendarStatus).toBe(true);

      useMenuStore.getState().setLoadingCalendarStatus(false);
      expect(useMenuStore.getState().isLoadingCalendarStatus).toBe(false);
    });
  });

  describe('session actions', () => {
    it('should set current session ID', () => {
      useMenuStore.getState().setCurrentSessionId('session-123');
      expect(useMenuStore.getState().currentSessionId).toBe('session-123');
    });

    it('should clear current session ID when set to null', () => {
      useMenuStore.getState().setCurrentSessionId('session-123');
      useMenuStore.getState().setCurrentSessionId(null);
      expect(useMenuStore.getState().currentSessionId).toBeNull();
    });

    it('should add session to the beginning of the list', () => {
      const session1 = { id: 'session-1', title: 'Session 1', date: '2024-12-19T10:00:00Z' };
      const session2 = { id: 'session-2', title: 'Session 2', date: '2024-12-19T11:00:00Z' };

      useMenuStore.getState().addSession(session1);
      useMenuStore.getState().addSession(session2);

      const sessions = useMenuStore.getState().sessions;
      expect(sessions).toHaveLength(2);
      expect(sessions[0].id).toBe('session-2'); // Most recent first
      expect(sessions[1].id).toBe('session-1');
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Modify all state
      useMenuStore.getState().openMenu();
      useMenuStore.getState().setCalendarStatus(true, 'test@example.com');
      useMenuStore.getState().setCurrentSessionId('session-123');
      useMenuStore.getState().addSession({ id: '1', title: 'Test', date: '2024-12-19T10:00:00Z' });

      // Reset
      useMenuStore.getState().reset();

      // Verify all reset
      const state = useMenuStore.getState();
      expect(state.isMenuOpen).toBe(false);
      expect(state.calendarConnected).toBe(false);
      expect(state.calendarEmail).toBeNull();
      expect(state.sessions).toEqual([]);
      expect(state.currentSessionId).toBeNull();
    });
  });

  describe('selectors', () => {
    it('should select isMenuOpen', () => {
      useMenuStore.getState().openMenu();
      expect(selectIsMenuOpen(useMenuStore.getState())).toBe(true);
    });

    it('should select sessions', () => {
      const session = { id: '1', title: 'Test', date: '2024-12-19T10:00:00Z' };
      useMenuStore.getState().addSession(session);
      expect(selectSessions(useMenuStore.getState())).toHaveLength(1);
    });

    it('should select currentSessionId', () => {
      useMenuStore.getState().setCurrentSessionId('session-123');
      expect(selectCurrentSessionId(useMenuStore.getState())).toBe('session-123');
    });

    it('should select isLoadingSessions', () => {
      expect(selectIsLoadingSessions(useMenuStore.getState())).toBe(false);
    });
  });
});
