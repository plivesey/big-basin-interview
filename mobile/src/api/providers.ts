import type { ProviderDetail, TimeSlot } from '@asba/shared-types';
import { apiGet } from './client';

export async function getProvider(providerId: string): Promise<ProviderDetail> {
  const data = await apiGet<{ provider: ProviderDetail }>(`/api/providers/${providerId}`);
  return data.provider;
}

export interface AvailabilityResponse {
  providerId: string;
  providerName: string;
  date: string;
  slots: TimeSlot[];
}

export function getAvailability(providerId: string, date: string): Promise<AvailabilityResponse> {
  return apiGet<AvailabilityResponse>(`/api/providers/${providerId}/availability?date=${date}`);
}
