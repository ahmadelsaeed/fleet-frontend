'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { initAuthStore, setToken as storeSetToken, clearToken as storeClearToken, getToken } from './auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('401')) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  /** False until localStorage has been read on the client (avoids hydration mismatch). */
  isReady: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  // Always start as null on both server and client so SSR HTML matches
  // the first client render. localStorage is only read after mount.
  const [token, setTokenState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initAuthStore();
    setTokenState(getToken());
    setIsReady(true);
  }, []);

  const setToken = (newToken: string) => {
    storeSetToken(newToken);
    setTokenState(newToken);
  };

  const clearToken = () => {
    storeClearToken();
    setTokenState(null);
  };

  const authValue = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: token !== null,
      isReady,
      setToken,
      clearToken,
    }),
    [token, isReady],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
}
