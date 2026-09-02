/**
 * AuthStore — module-level singleton for bearer token management.
 *
 * Intentionally NOT React state so the ApiClient can read the token
 * synchronously from outside the React component tree.
 *
 * localStorage operations are always wrapped in try/catch to gracefully
 * handle environments where localStorage is unavailable (e.g. private
 * browsing modes that block storage access). In those cases the token
 * lives in memory only and is lost on page refresh.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6
 */

export const AUTH_STORAGE_KEY = 'fleet_auth_token';

let _token: string | null = null;

/**
 * Call once at app initialisation (root layout or AuthProvider mount).
 * Reads the stored token from localStorage into memory so it is available
 * before any API request is made. (Req 2.2, 2.3)
 */
export function initAuthStore(): void {
  if (typeof window === 'undefined') {
    _token = null;
    return;
  }

  try {
    _token = localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    // Req 2.6 — localStorage unavailable; treat as no token
    _token = null;
  }
}

/** Returns the current in-memory token, or null if not authenticated. */
export function getToken(): string | null {
  return _token;
}

/**
 * Persists a token to memory and localStorage.
 * Overwrites any previously stored value. (Req 2.1)
 */
export function setToken(token: string): void {
  _token = token;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  } catch {
    // Req 2.6 — ignore localStorage errors; token is still in memory
  }
}

/**
 * Removes the token from both memory and localStorage. (Req 2.4)
 * After this call getToken() returns null and
 * localStorage.getItem(AUTH_STORAGE_KEY) returns null.
 */
export function clearToken(): void {
  _token = null;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Req 2.6 — ignore localStorage errors
  }
}
