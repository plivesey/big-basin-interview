import { BACKEND_URL, REQUEST_TIMEOUT_MS } from './config';
import { logger } from '../utils/logger';

/**
 * A thin fetch wrapper for the backend's `{ success, data }` envelope.
 *
 * The web app calls `fetch` directly in four files with no timeout and no
 * shared error handling. On a phone that is not a style problem: a request on a
 * flaky cellular connection can hang indefinitely without ever rejecting, which
 * leaves loading flags stuck true and the user staring at a spinner with no way
 * out. Every request here is aborted after REQUEST_TIMEOUT_MS.
 */

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, body: Partial<ApiErrorBody> | undefined, fallback: string) {
    super(body?.message ?? fallback);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.code ?? 'UNKNOWN';
    this.details = body?.details;
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    clearTimeout(timeout);
    const aborted = error instanceof Error && error.name === 'AbortError';
    logger.warn('Request failed', { url, aborted, error: String(error) });
    throw new ApiError(0, undefined, aborted ? 'The request timed out.' : 'Network request failed.');
  }
  clearTimeout(timeout);

  let body: Envelope<T> | undefined;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    body = undefined;
  }

  if (!response.ok || body?.success === false) {
    throw new ApiError(response.status, body?.error, 'Request failed.');
  }

  // /api/heartbeat is the one endpoint that is not wrapped in the envelope.
  return (body?.data ?? (body as unknown)) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<T>(path: string, payload?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}
