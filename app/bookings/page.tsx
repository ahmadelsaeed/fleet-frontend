'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { cancelBooking, getMyBookings } from '@/lib/api/bookings';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import BookingCard from '@/components/booking/BookingCard';
import { useState } from 'react';
import type { Booking } from '@/lib/api/types';
import { unwrapArray } from '@/lib/response';
import Toast from '@/components/ui/Toast';

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [cancelErrorId, setCancelErrorId] = useState<number | null>(null);
  const [pendingCancelId, setPendingCancelId] = useState<number | null>(null);
  const [showCanceledToast, setShowCanceledToast] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.myBookings(),
    queryFn: getMyBookings,
  });

  const bookings = unwrapArray<Booking>(data);

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      setCancelErrorId(null);
      setPendingCancelId(null);
      setShowCanceledToast(true);
      queryClient.invalidateQueries({
        queryKey: queryKeys.myBookings(),
      });
    },
    onError: (_err, id) => {
      setCancelErrorId(id);
      setPendingCancelId(null);
    },
  });

  return (
    <ProtectedRoute>
      {showCanceledToast && (
        <Toast
          type="success"
          message="Booking canceled."
          timeoutMs={4000}
          onDismiss={() => setShowCanceledToast(false)}
        />
      )}
      <div className="space-y-6">
        <header className="glass-panel rounded-3xl p-6 sm:p-8">
          <span className="pill">Trips history</span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
            My Bookings
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            View and manage your upcoming and past trips.
          </p>
        </header>

        {isLoading && <LoadingSpinner />}

        {isError && (
          <ErrorBanner
            message={
              error instanceof Error
                ? error.message
                : 'Failed to load bookings. Please try again.'
            }
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && bookings && bookings.length === 0 && (
          <EmptyState message="You haven&apos;t booked any trips yet">
            <Link
              href="/"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Browse trips
            </Link>
          </EmptyState>
        )}

        {!isLoading && !isError && bookings && bookings.length > 0 && (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="space-y-2">
                <BookingCard
                  booking={booking}
                  onCancel={(id) => setPendingCancelId(id)}
                  isCancelling={
                    cancelMutation.isPending &&
                    cancelMutation.variables === booking.id
                  }
                />
                {cancelErrorId === booking.id && (
                  <ErrorBanner message="Failed to cancel booking. Please try again." />
                )}
              </div>
            ))}
          </div>
        )}

        {pendingCancelId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-zinc-900">Cancel booking?</h2>
              <p className="mt-2 text-sm text-zinc-600">
                This action will cancel your reservation. You can&apos;t undo it later.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingCancelId(null)}
                  className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Keep booking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cancelMutation.mutate(pendingCancelId);
                  }}
                  disabled={cancelMutation.isPending}
                  className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelMutation.isPending && cancelMutation.variables === pendingCancelId
                    ? 'Cancelling…'
                    : 'Yes, cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
