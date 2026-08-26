import { apiGet } from './client';

export interface Heartbeat {
  status: string;
  timestamp: string;
  message: string;
}

export function getHeartbeat(): Promise<Heartbeat> {
  return apiGet<Heartbeat>('/api/heartbeat');
}
