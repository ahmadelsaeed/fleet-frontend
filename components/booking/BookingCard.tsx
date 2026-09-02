import Link from 'next/link';
import type { Booking } from '@/lib/api/types';

type BookingCardProps = {
  booking: Booking;
  onCancel: (id: number) => void;
  isCancelling: boolean;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isFutureDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() >= today.getTime();
}

export default function BookingCard({
  booking,
  onCancel,
  isCancelling,
}: BookingCardProps) {
  const trip = booking?.trip;
  const startStop = booking?.start_stop;
  const endStop = booking?.end_stop;
  const tripDate = trip?.date ?? '';
  const canCancel = tripDate ? isFutureDate(tripDate) : false;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
              {trip?.code ?? '—'}
            </span>
            <span className="text-sm font-medium text-zinc-700">
              {trip ? formatDate(trip.date) : '—'}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-zinc-900">
              {startStop?.station?.name ?? '—'}
            </span>
            <span className="mx-1.5 text-zinc-400" aria-hidden="true">
              →
            </span>
            <span className="font-semibold text-zinc-900">
              {endStop?.station?.name ?? '—'}
            </span>
          </div>
          <div className="text-sm text-zinc-600">
            Seat{' '}
            <span className="font-semibold text-zinc-900">
              {booking?.seat?.seat_number ?? '—'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link
            href={`/bookings/${booking.id}`}
            className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View details
          </Link>

          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(booking.id)}
              disabled={isCancelling}
              className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:self-start"
            >
              {isCancelling ? 'Cancelling…' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
