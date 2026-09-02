import { apiFetch } from './client';
import type { AuthResponse, User } from './types';

/**
 * POST /register
 * Creates a new user account and returns an auth token.
 * Satisfies Requirement 3.2.
 */
export function register(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/register', {
    method: 'POST',
    body: data,
  });
}

/**
 * POST /login
 * Authenticates an existing user and returns an auth token.
 * Satisfies Requirement 4.2.
 */
export function login(data: {
  login: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<{ success?: boolean; message?: string; data?: AuthResponse }>(
    '/login',
    {
      method: 'POST',
      body: data,
    },
  ).then((payload) => {
    const auth = (payload?.data ?? payload) as Partial<AuthResponse> | undefined;
    if (!auth || !auth.user || !auth.token) {
      throw new Error('Invalid login response.');
    }
    return auth as AuthResponse;
  });
}

/**
 * POST /logout
 * Invalidates the current session token on the server.
 * Returns void (API responds with 204 No Content).
 * Satisfies Requirement 5.1.
 */
export function logout(): Promise<void> {
  return apiFetch<void>('/logout', {
    method: 'POST',
  });
}

/**
 * GET /me
 * Returns the currently authenticated user's profile.
 * Satisfies Requirement 1.1 (getMe endpoint).
 */
export function getMe(): Promise<User> {
  return apiFetch<User>('/me');
}
