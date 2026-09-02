import { useEffect } from 'react';

type ToastProps = {
  message: string;
  type: 'success' | 'error';
  timeoutMs?: number;
  onDismiss: () => void;
};

export default function Toast({
  message,
  type,
  timeoutMs = 5000,
  onDismiss,
}: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, timeoutMs);
    return () => window.clearTimeout(timer);
  }, [timeoutMs, onDismiss]);

  const bgClass =
    type === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : 'border-red-200 bg-red-50 text-red-800';

  const btnClass =
    type === 'success'
      ? 'text-green-600 hover:text-green-800 focus:ring-green-500'
      : 'text-red-600 hover:text-red-800 focus:ring-red-500';

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${bgClass}`}
    >
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className={`ml-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${btnClass}`}
      >
        &times;
      </button>
    </div>
  );
}
