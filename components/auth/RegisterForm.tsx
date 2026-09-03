'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/providers';
import { register } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/types';

function fieldError(
  errors: Record<string, string[]> | undefined,
  field: string,
): string | null {
  const list = errors?.[field];
  if (!list || list.length === 0) return null;
  return list[0];
}

function errorId(field: string) {
  return `${field}-error`;
}

export default function RegisterForm() {
  const { isAuthenticated, isReady, setToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    const target = redirect && redirect.startsWith('/') ? redirect : '/';
    router.replace(target);
  }, [isReady, isAuthenticated, redirect, router]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [passwordMatchError, setPasswordMatchError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setGenericError(null);

    if (password !== passwordConfirmation) {
      setPasswordMatchError('Passwords do not match.');
      return;
    }
    setPasswordMatchError(null);

    setIsSubmitting(true);
    try {
      const result = await register({
        name,
        email,
        phone,
        password,
        password_confirmation: passwordConfirmation,
      });
      setToken(result.token);
      const target = redirect && redirect.startsWith('/') ? redirect : '/';
      router.push(target);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422 && err.errors) {
          setFieldErrors(err.errors);
        } else {
          setGenericError(err.message || 'Registration failed. Please try again.');
        }
      } else {
        setGenericError('Registration failed. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const nameErr = fieldError(fieldErrors, 'name');
  const emailErr = fieldError(fieldErrors, 'email');
  const phoneErr = fieldError(fieldErrors, 'phone');
  const passwordErr = fieldError(fieldErrors, 'password');

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {genericError !== null && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {genericError}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={nameErr !== null}
          aria-describedby={nameErr ? errorId('name') : undefined}
          className="field-input"
          disabled={isSubmitting}
          placeholder="Full name"
        />
        {nameErr !== null && (
          <p id={errorId('name')} className="text-sm text-red-600">
            {nameErr}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          maxLength={254}
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailErr !== null}
          aria-describedby={emailErr ? errorId('email') : undefined}
          className="field-input"
          disabled={isSubmitting}
          placeholder="you@example.com"
        />
        {emailErr !== null && (
          <p id={errorId('email')} className="text-sm text-red-600">
            {emailErr}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={phoneErr !== null}
          aria-describedby={phoneErr ? errorId('phone') : undefined}
          className="field-input"
          disabled={isSubmitting}
          placeholder="+20 100 000 0000"
        />
        {phoneErr !== null && (
          <p id={errorId('phone')} className="text-sm text-red-600">
            {phoneErr}
          </p>
        )}
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
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={passwordErr !== null || passwordMatchError !== null}
          aria-describedby={
            passwordErr || passwordMatchError ? errorId('password') : undefined
          }
          className="field-input"
          disabled={isSubmitting}
          placeholder="At least 8 characters"
        />
        {passwordErr !== null && (
          <p id={errorId('password')} className="text-sm text-red-600">
            {passwordErr}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password_confirmation"
          className="block text-sm font-medium text-zinc-700"
        >
          Confirm password
        </label>
        <input
          id="password_confirmation"
          name="password_confirmation"
          type="password"
          maxLength={128}
          autoComplete="new-password"
          required
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          aria-invalid={passwordMatchError !== null}
          aria-describedby={
            passwordMatchError ? 'password_confirmation-error' : undefined
          }
          className="field-input"
          disabled={isSubmitting}
          placeholder="Same as password"
        />
        {passwordMatchError !== null && (
          <p id="password_confirmation-error" className="text-sm text-red-600">
            {passwordMatchError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="primary-button w-full"
      >
        {isSubmitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Creating account…
          </>
        ) : (
          'Create account'
        )}
      </button>

      <p className="text-center text-sm text-zinc-600">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
