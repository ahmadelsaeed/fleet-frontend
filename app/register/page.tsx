import { Suspense } from 'react';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <span className="pill">Create account</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">Create your account</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Register to book bus tickets and manage your trips.
        </p>
      </div>
      <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        <Suspense fallback={<div className="text-sm text-zinc-500">Loading…</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
