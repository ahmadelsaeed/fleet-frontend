import type { ReactNode } from 'react';

type EmptyStateProps = {
  message: string;
  children?: ReactNode;
};

export default function EmptyState({ message, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16 px-6 text-center">
      <p className="text-sm font-medium text-zinc-600">{message}</p>
      {children !== undefined && <div className="mt-2">{children}</div>}
    </div>
  );
}
