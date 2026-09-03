'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getTrips } from '@/lib/api/trips';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import TripCard from '@/components/trips/TripCard';
import type { Trip } from '@/lib/api/types';
import { useState } from 'react';

export default function HomePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.tripsPage(page),
    queryFn: () => getTrips(page),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to load trips. Please try again.';
    return (
      <ErrorBanner
        message={message}
        onRetry={() => refetch()}
      />
    );
  }

  const trips: Trip[] = data?.data ?? [];
  const meta = data?.meta;

  if (trips.length === 0) {
    return (
      <EmptyState message="No trips available at the moment.">
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            refetch();
          }}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Refresh
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <header className="glass-panel overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <span className="pill">Popular routes</span>
            <div>
              <h1 className="section-title">Available Trips</h1>
              <p className="section-subtitle mt-2">
                Browse our scheduled routes and book your seat.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-700 shadow-sm">
            {trips.length} trip{trips.length === 1 ? '' : 's'} on this page
          </div>
        </div>
      </header>

      <div className="grid gap-4">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>

      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-600">
            Page {meta.page} of {meta.total_pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
            disabled={page >= meta.total_pages}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
