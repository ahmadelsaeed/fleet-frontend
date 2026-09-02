'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { cancelBooking, getBooking } from '@/lib/api/bookings';
import { ApiError, type Booking } from '@/lib/api/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import Toast from '@/components/ui/Toast';
import { normalizeBookingResponse } from '@/lib/response';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function isFutureDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() >= today.getTime();
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<ProtectedRoute><LoadingSpinner /></ProtectedRoute>}>
      <BookingDetailContent />
    </Suspense>
  );
}

function BookingDetailContent() {
  const params = useParams<{ id: string }>();
  const bookingId = Number(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get('success') === '1';

  const handleBackToBookings = () => {
    queryClient.clear();
    router.refresh();
    router.push('/bookings');
  };

  const [successDismissed, setSuccessDismissed] = useState(!showSuccess);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCanceledToast, setShowCanceledToast] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.booking(bookingId),
    queryFn: () => getBooking(bookingId),
    enabled: Number.isFinite(bookingId) && bookingId > 0,
  });

  const booking = normalizeBookingResponse(data);

  const is404 =
    !isLoading &&
    !isError &&
    booking === undefined &&
    Number.isFinite(bookingId);

  const notFoundFromError =
    isError && error instanceof ApiError && error.status === 404;

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      setCancelError(null);
      setShowCancelModal(false);
      setShowCanceledToast(true);
      queryClient.invalidateQueries({
        queryKey: queryKeys.booking(bookingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.myBookings(),
      });
      router.push('/bookings');
    },
    onError: (err) => {
      if (err instanceof Error) {
        setCancelError(err.message || 'Failed to cancel booking.');
      } else {
        setCancelError('Failed to cancel booking.');
      }
      setShowCancelModal(false);
    },
  });

  if (isLoading) {
    return (
      <ProtectedRoute>
        <LoadingSpinner />
      </ProtectedRoute>
    );
  }

  if (notFoundFromError || is404) {
    return (
      <ProtectedRoute>
        <EmptyState message="Booking not found.">
          <button
            type="button"
            onClick={handleBackToBookings}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to my bookings
          </button>
        </EmptyState>
      </ProtectedRoute>
    );
  }

  if (isError) {
    return (
      <ProtectedRoute>
        <ErrorBanner
          message={
            error instanceof Error
              ? error.message
              : 'Failed to load booking. Please try again.'
          }
          onRetry={() => refetch()}
        />
      </ProtectedRoute>
    );
  }

  if (!booking) return null;

  const canCancel = booking.trip?.date ? isFutureDate(booking.trip.date) : false;

  return (
    <ProtectedRoute>
      {!successDismissed && (
        <Toast
          type="success"
          message="Booking confirmed! Your seat has been reserved."
          timeoutMs={5000}
          onDismiss={() => setSuccessDismissed(true)}
        />
      )}
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
          <button
            type="button"
            onClick={handleBackToBookings}
            className="text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
          >
            ← Back to my bookings
          </button>
          <div className="mt-4 flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Booking #{booking.id}
            </h1>
            {showSuccess && !successDismissed && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 ring-1 ring-green-200">
                Confirmed
              </span>
            )}
          </div>
        </header>

        {cancelError !== null && <ErrorBanner message={cancelError} />}

        <div className="soft-card rounded-3xl p-6">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Trip code
              </dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900">
                {booking.trip.code}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Trip date
              </dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900">
                {formatDate(booking.trip.date)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Route
              </dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900">
                {booking.start_stop.station.name}
                <span className="mx-1.5 text-zinc-400">→</span>
                {booking.end_stop.station.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Seat
              </dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900">
                {booking.seat.seat_number}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Booked at
              </dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900">
                {formatDateTime(booking.created_at)}
              </dd>
            </div>
          </dl>

          {canCancel && (
            <div className="mt-6 pt-6 border-t border-zinc-100 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={cancelMutation.isPending}
                className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelMutation.isPending ? 'Cancelling…' : 'Cancel booking'}
              </button>
            </div>
          )}

          {showCancelModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
              <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-zinc-900">Cancel booking?</h2>
                <p className="mt-2 text-sm text-zinc-600">
                  This action will cancel your reservation. You can&apos;t undo it later.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Keep booking
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelMutation.mutate(bookingId)}
                    disabled={cancelMutation.isPending}
                    className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancelMutation.isPending ? 'Cancelling…' : 'Yes, cancel'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
