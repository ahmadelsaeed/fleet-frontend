'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/providers';
import { login } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/types';

const INVALID_CREDENTIALS = 'Invalid email/phone or password.';

export default function LoginForm() {
  const { isAuthenticated, setToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (isAuthenticated) {
      const target = redirect && redirect.startsWith('/') ? redirect : '/';
      router.replace(target);
    }
  }, [isAuthenticated, redirect, router]);

  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInlineError(null);
    setIsSubmitting(true);
    try {
      const result = await login({ login: loginValue.trim(), password });
      setToken(result.token);
      const target = redirect && redirect.startsWith('/') ? redirect : '/';
      router.push(target);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 422) {
          setInlineError(INVALID_CREDENTIALS);
        } else {
          setInlineError(err.message || 'Login failed. Please try again.');
        }
      } else {
        setInlineError('Login failed. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {inlineError !== null && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          aria-describedby="email password"
        >
          {inlineError}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="login" className="block text-sm font-medium text-zinc-700">
          Email or phone
        </label>
        <input
          id="login"
          name="login"
          type="text"
          maxLength={254}
          autoComplete="username"
          required
          value={loginValue}
          onChange={(e) => setLoginValue(e.target.value)}
          aria-invalid={inlineError !== null}
          aria-describedby={inlineError ? 'login-error' : undefined}
          className="field-input"
          disabled={isSubmitting}
          placeholder="you@example.com or +966..."
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          maxLength={128}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={inlineError !== null}
          aria-describedby={inlineError ? 'login-error' : undefined}
          className="field-input"
          disabled={isSubmitting}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="primary-button w-full"
      >
        {isSubmitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Logging in…
          </>
        ) : (
          'Log in'
        )}
      </button>

      <p className="text-center text-sm text-zinc-600">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
        >
          Register
        </Link>
      </p>
    </form>
  );
}
