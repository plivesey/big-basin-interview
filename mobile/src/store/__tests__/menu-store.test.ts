jest.mock('../../api/sessions', () => ({ listSessions: jest.fn() }));
jest.mock('../../api/calendar', () => ({
  getCalendarStatus: jest.fn(),
  disconnectCalendar: jest.fn(),
}));

/* eslint-disable import/first -- must follow the jest.mock calls above. */
import { useMenuStore } from '../menu-store';
import { listSessions } from '../../api/sessions';
import { getCalendarStatus, disconnectCalendar } from '../../api/calendar';
/* eslint-enable import/first */

describe('menu-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMenuStore.getState().reset();
  });

  it('starts closed with nothing loaded', () => {
    const state = useMenuStore.getState();
    expect(state.isMenuOpen).toBe(false);
    expect(state.sessions).toEqual([]);
    expect(state.calendarConnected).toBe(false);
  });

  it('toggles open and closed', () => {
    useMenuStore.getState().toggleMenu();
    expect(useMenuStore.getState().isMenuOpen).toBe(true);
    useMenuStore.getState().toggleMenu();
    expect(useMenuStore.getState().isMenuOpen).toBe(false);
  });

  it('loads the conversation list', async () => {
    (listSessions as jest.Mock).mockResolvedValue([
      { id: 'a', title: 'Luxe Salon', date: '2026-08-26T10:00:00.000Z' },
    ]);

    await useMenuStore.getState().fetchSessions();

    expect(useMenuStore.getState().sessions).toHaveLength(1);
    expect(useMenuStore.getState().isLoadingSessions).toBe(false);
  });

  it('stops loading when the session list fails', async () => {
    (listSessions as jest.Mock).mockRejectedValue(new Error('offline'));

    await useMenuStore.getState().fetchSessions();

    expect(useMenuStore.getState().sessions).toEqual([]);
    expect(useMenuStore.getState().isLoadingSessions).toBe(false);
  });

  it('reads the calendar connection', async () => {
    (getCalendarStatus as jest.Mock).mockResolvedValue({
      connected: true,
      email: 'peter@example.com',
    });

    await useMenuStore.getState().fetchCalendarStatus();

    const state = useMenuStore.getState();
    expect(state.calendarConnected).toBe(true);
    expect(state.calendarEmail).toBe('peter@example.com');
    expect(state.isLoadingCalendarStatus).toBe(false);
  });

  it('clears the connection after disconnecting', async () => {
    (getCalendarStatus as jest.Mock).mockResolvedValue({
      connected: true,
      email: 'peter@example.com',
    });
    (disconnectCalendar as jest.Mock).mockResolvedValue({ disconnected: true });

    await useMenuStore.getState().fetchCalendarStatus();
    await useMenuStore.getState().disconnectCalendar();

    const state = useMenuStore.getState();
    expect(state.calendarConnected).toBe(false);
    expect(state.calendarEmail).toBeNull();
  });

  it('leaves the connection alone when disconnecting fails', async () => {
    (getCalendarStatus as jest.Mock).mockResolvedValue({ connected: true, email: 'p@e.com' });
    (disconnectCalendar as jest.Mock).mockRejectedValue(new Error('502'));

    await useMenuStore.getState().fetchCalendarStatus();
    await useMenuStore.getState().disconnectCalendar();

    expect(useMenuStore.getState().calendarConnected).toBe(true);
  });

  it('tracks which conversation is showing', () => {
    useMenuStore.getState().setCurrentSessionId('session-1');
    expect(useMenuStore.getState().currentSessionId).toBe('session-1');
  });

  it('puts a newly created conversation at the top', () => {
    useMenuStore.getState().addSession({ id: 'a', title: 'One', date: '2026-08-01T00:00:00.000Z' });
    useMenuStore.getState().addSession({ id: 'b', title: 'Two', date: '2026-08-02T00:00:00.000Z' });
    expect(useMenuStore.getState().sessions.map((s) => s.id)).toEqual(['b', 'a']);
  });
});
