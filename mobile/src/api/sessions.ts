import type { SessionListItem } from '@asba/shared-types';
import { apiGet } from './client';

export async function listSessions(): Promise<SessionListItem[]> {
  const data = await apiGet<{ sessions: SessionListItem[] }>('/api/sessions');
  return data.sessions;
}
