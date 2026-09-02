import { useEffect } from 'react';

type ConflictBannerProps = {
  visible: boolean;
  onDismiss: () => void;
};

const MESSAGE =
  'This seat was just booked by someone else. Please choose another seat.';

export default function ConflictBanner({
  visible,
  onDismiss,
}: ConflictBannerProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(onDismiss, 8000);
    return () => window.clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-sm"
    >
      <div
        aria-hidden="true"
        className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-200 text-amber-800"
      >
        !
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-amber-900">
          Seat no longer available
        </h3>
        <p className="mt-1 text-sm text-amber-800">{MESSAGE}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss seat conflict message"
        className="ml-2 inline-flex h-6 w-6 flex-none items-center justify-center rounded-md text-sm text-amber-700 transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        &times;
      </button>
    </div>
  );
}
