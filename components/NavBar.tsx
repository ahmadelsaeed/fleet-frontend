'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/providers';
import { logout as apiLogout } from '@/lib/api/auth';

export default function NavBar() {
  const { isAuthenticated, isReady, clearToken } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiLogout();
    } catch {
      // Ignore API errors — always clear the token and navigate away
      // per Req 5.3: "regardless of API result"
    } finally {
      clearToken();
      setIsLoggingOut(false);
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <nav className="page-shell flex h-16 items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-lg font-bold tracking-tight text-zinc-900 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-black text-white shadow-lg shadow-blue-500/30">
            F
          </span>
          Fleet
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isReady ? (
            <div className="h-9 w-40" aria-hidden="true" />
          ) : isAuthenticated ? (
            <>
              <Link
                href="/bookings"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                My Bookings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? 'Logging out…' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
