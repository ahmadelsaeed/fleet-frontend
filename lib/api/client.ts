import { ApiError } from './types';
import { getToken, clearToken } from '../auth';

/**
 * Core fetch helper for all API communication.
 *
 * Responsibilities:
 * - Prefixes every path with NEXT_PUBLIC_API_URL (Req 1.3)
 * - Attaches Authorization: Bearer header when a token is present (Req 1.2)
 * - Sets Content-Type: application/json for requests with a body (Req 1.6)
 * - Throws ApiError(0, ...) on network failures before any HTTP response (Req 1.8)
 * - Throws ApiError(status, ...) for any non-2xx HTTP response (Req 1.4)
 * - On 401: clears AuthStore token and navigates to /login (Req 1.5)
 * - Throws before dispatch when NEXT_PUBLIC_API_URL is not defined (Req 1.7)
 *
 * The function is intentionally free of React and Next.js Router dependencies
 * so it can be called from anywhere (components, TanStack Query fetchers, etc.).
 * 401 navigation uses window.location.href because the function runs outside the
 * React component tree where useRouter is unavailable.
 */
type ApiFetchInit = Omit<RequestInit, 'body'> & { body?: unknown };

export async function apiFetch<T>(
  path: string,
  init?: ApiFetchInit,
): Promise<T> {
  // Req 1.7 — fail fast when the base URL is not configured
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not defined. ' +
        'Set it in .env.local before making API requests.',
    );
  }

  // Build headers
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  // Req 1.2 — attach bearer token when present
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Req 1.6 — set Content-Type for requests that include a body
  const hasBody = init?.body !== undefined;
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  // Req 1.3 — prefix path with base URL
  const url = `${baseUrl}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { ...headers, ...(init?.headers as Record<string, string>) },
      body: hasBody ? JSON.stringify(init!.body) : undefined,
    });
  } catch {
    // Req 1.8 — network failure before any HTTP response
    throw new ApiError(0, 'Network error. Please check your connection.');
  }

  if (!response.ok) {
    // Attempt to parse the response body for a structured error message
    let message: string = response.statusText || 'An error occurred.';
    let errors: Record<string, string[]> | undefined;

    try {
      const json = await response.json();
      if (typeof json.message === 'string' && json.message) {
        message = json.message;
      }
      if (json.errors && typeof json.errors === 'object') {
        errors = json.errors as Record<string, string[]>;
      }
    } catch {
      // Body is not parseable as JSON — fall through with statusText
    }

    // Req 1.5 — 401 clears the stored token and redirects to /login
    if (response.status === 401) {
      clearToken();
      // Navigate outside the React tree; window is available in client components
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Req 1.4 — always throw a typed ApiError for non-2xx responses
    throw new ApiError(response.status, message, errors);
  }

  // 204 No Content — return undefined cast to T (callers should type accordingly)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// Re-export ApiError so consumers can import it from either types.ts or client.ts
export { ApiError } from './types';
