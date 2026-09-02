import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <span className="pill">Welcome back</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">Log in to Fleet</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Welcome back. Log in to book and manage your trips.
        </p>
      </div>
      <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        <Suspense fallback={<div className="text-sm text-zinc-500">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
