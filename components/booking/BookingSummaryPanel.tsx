import Link from 'next/link';
import type { SeatData, Station, TripStop } from '@/lib/api/types';

type BookingSummaryPanelProps = {
  startStation: Station | null;
  endStation: Station | null;
  selectedSeat: SeatData | null;
  isAuthenticated: boolean;
  tripId: number;
  onConfirm: () => void;
  isSubmitting: boolean;
};

export default function BookingSummaryPanel({
  startStation,
  endStation,
  selectedSeat,
  isAuthenticated,
  tripId,
  onConfirm,
  isSubmitting,
}: BookingSummaryPanelProps) {
  const canConfirm =
    isAuthenticated &&
    startStation !== null &&
    endStation !== null &&
    selectedSeat !== null;

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-zinc-900">Book your seat</h3>
        <p className="mt-2 text-sm text-zinc-600">
          Log in to confirm your booking and manage your trips.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(`/trips/${tripId}`)}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Log in to book
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-900">Booking summary</h3>
      <dl className="mt-3 divide-y divide-zinc-100 text-sm">
        <div className="flex justify-between py-2">
          <dt className="text-zinc-500">Route</dt>
          <dd className="font-medium text-zinc-900">
            {startStation && endStation
              ? `${startStation.name} → ${endStation.name}`
              : '—'}
          </dd>
        </div>
        <div className="flex justify-between py-2">
          <dt className="text-zinc-500">Seat</dt>
          <dd className="font-medium text-zinc-900">
            {selectedSeat ? selectedSeat.seat_number : 'Not selected'}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!canConfirm || isSubmitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Confirming…
          </>
        ) : (
          'Confirm Booking'
        )}
      </button>
    </div>
  );
}
