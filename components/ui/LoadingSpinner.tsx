export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div
        role="status"
        aria-label="Loading"
        className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
