/**
 * API request and response types
 */

import type { Provider, Booking, Session } from '../db/schema';

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Provider API types
export interface ProviderSearchParams {
  category?: string;
  location?: string;
  ratingMin?: number;
  limit?: number;
}

export interface ProviderListResponse {
  providers: Provider[];
  total: number;
}

export interface ProviderDetailResponse {
  provider: Provider;
}

// Booking API types
export interface CreateBookingRequest {
  providerId: string;
  serviceType: string;
  scheduledAt: string; // ISO datetime
  duration: number; // minutes
  notes?: string;
  idempotencyKey: string;
}

export interface BookingResponse {
  booking: Booking;
  calendarEvent?: {
    id: string;
    link: string;
  };
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
}

export interface BookingDetailResponse {
  booking: Booking;
  provider: Provider;
}

// Session API types
export interface CreateSessionResponse {
  sessionId: string;
  status: string;
  createdAt: Date;
}

export interface SessionDetailResponse {
  session: Session;
}

// Time slot types
export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface AvailabilitySlotsResponse {
  providerId: string;
  date: string;
  slots: TimeSlot[];
}

// Chat API types
export interface SendMessageRequest {
  message: string;
}

export interface MessageStatusResponse {
  status: 'processing' | 'complete' | 'error';
  messageId?: string;
}
