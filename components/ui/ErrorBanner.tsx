type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">{message}</p>
        {onRetry !== undefined && (
          <button
            type="button"
            onClick={onRetry}
            aria-label="Retry failed action"
            className="inline-flex items-center justify-center rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
