import Link from 'next/link';
import type { Trip } from '@/lib/api/types';
import RouteBreadcrumb from './RouteBreadcrumb';

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(utcDate);
}

type TripCardProps = {
  trip: Trip;
};

export default function TripCard({ trip }: TripCardProps) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group block rounded-3xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="pill">Trip {trip.code}</span>
            <span className="text-xs font-medium text-zinc-500">{trip.bus.name}</span>
          </div>
          <RouteBreadcrumb stops={trip.stops} />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 bg-slate-50/80 px-3.5 py-2.5 sm:flex-col sm:items-end sm:justify-center">
          <div className="text-sm font-medium text-zinc-700">{formatDate(trip.date)}</div>
          <div className="text-sm font-semibold text-blue-600 transition group-hover:text-blue-700">
            View seats →
          </div>
        </div>
      </div>
    </Link>
  );
}
