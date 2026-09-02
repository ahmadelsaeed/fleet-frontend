'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { getAvailableSeats, getTrip } from '@/lib/api/trips';
import { createBooking } from '@/lib/api/bookings';
import { ApiError, type Trip } from '@/lib/api/types';
import type { SeatData, Station, TripStop } from '@/lib/api/types';
import { useAuth } from '@/lib/providers';
import {
  normalizeTripResponse,
  normalizeAvailableSeatsResponse,
} from '@/lib/response';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBanner from '@/components/ui/ErrorBanner';
import EmptyState from '@/components/ui/EmptyState';
import RouteBreadcrumb from '@/components/trips/RouteBreadcrumb';
import StationSelect from '@/components/trips/StationSelect';
import SeatMap from '@/components/seats/SeatMap';
import BookingSummaryPanel from '@/components/booking/BookingSummaryPanel';
import ConflictBanner from '@/components/booking/ConflictBanner';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function stationFromStop(
  stops: TripStop[],
  stationId: number | null,
): Station | null {
  if (stationId === null) return null;
  const stop = stops.find((s) => s.station.id === stationId);
  return stop ? stop.station : null;
}

function firstFieldError(errors: Record<string, string[]> | undefined): string | null {
  if (!errors) return null;
  for (const key in errors) {
    const arr = errors[key];
    if (arr && arr.length > 0) return arr[0];
  }
  return null;
}

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const tripId = Number(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [startStationId, setStartStationId] = useState<number | null>(null);
  const [endStationId, setEndStationId] = useState<number | null>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [conflictVisible, setConflictVisible] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const {
    data,
    isLoading: tripLoading,
    isError: tripIsError,
    error: tripError,
    refetch: refetchTrip,
  } = useQuery({
    queryKey: queryKeys.trip(tripId),
    queryFn: () => getTrip(tripId),
    enabled: Number.isFinite(tripId) && tripId > 0,
  });

  const trip = normalizeTripResponse(data);

  const seatsEnabled =
    startStationId !== null &&
    endStationId !== null &&
    trip !== undefined;

  const {
    data: seatsData,
    isLoading: seatsLoading,
    isError: seatsIsError,
    error: seatsError,
    refetch: refetchSeats,
  } = useQuery({
    queryKey: queryKeys.availableSeats(tripId, startStationId!, endStationId!),
    queryFn: () => getAvailableSeats(tripId, startStationId!, endStationId!),
    enabled: seatsEnabled,
  });

  const seats: SeatData[] = normalizeAvailableSeatsResponse(seatsData)?.seats ?? [];
  const selectedSeat: SeatData | null = useMemo(
    () => seats.find((s) => s.seat_id === selectedSeatId) ?? null,
    [seats, selectedSeatId],
  );

  const startStation = stationFromStop(trip?.stops ?? [], startStationId);
  const endStation = stationFromStop(trip?.stops ?? [], endStationId);

  const createBookingMutation = useMutation({
    mutationFn: () =>
      createBooking({
        trip_id: tripId,
        seat_id: selectedSeatId!,
        start_station_id: startStationId!,
        end_station_id: endStationId!,
      }),
    onSuccess: (booking) => {
      router.push(`/bookings/${booking.id}?success=1`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setConflictVisible(true);
          setSelectedSeatId(null);
          if (startStationId !== null && endStationId !== null) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.availableSeats(
                tripId,
                startStationId,
                endStationId,
              ),
            });
          }
          setBookingError(null);
        } else if (err.status === 422) {
          const msg =
            firstFieldError(err.errors) ||
            err.message ||
            'Please double-check your station and seat selection.';
          setBookingError(msg);
        } else {
          setBookingError(
            err.message || 'Booking failed. Please try again.',
          );
        }
      } else {
        setBookingError('Booking failed. Please try again.');
      }
    },
  });

  const handleConfirm = () => {
    if (
      selectedSeatId === null ||
      startStationId === null ||
      endStationId === null
    ) {
      return;
    }
    setBookingError(null);
    createBookingMutation.mutate();
  };

  if (tripLoading) {
    return <LoadingSpinner />;
  }

  if (tripIsError) {
    const message =
      tripError instanceof Error
        ? tripError.message
        : 'Failed to load trip. Please try again.';
    return (
      <ErrorBanner message={message} onRetry={() => refetchTrip()} />
    );
  }

  if (!trip) {
    return (
      <EmptyState message="Trip not found.">
        <a
          href="/"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to trips
        </a>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8">
      <header className="glass-panel rounded-3xl p-6 sm:p-8">
        <div>
          <a
            href="/"
            className="text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
          >
            ← All trips
          </a>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Trip {trip?.code ?? '—'}
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
              {trip?.bus?.name ?? 'Bus'}
            </span>
          </div>
          <p className="text-sm text-zinc-600">{trip ? formatDate(trip.date) : '—'}</p>
        </div>
        <div className="mt-4">
          <RouteBreadcrumb stops={trip?.stops ?? []} />
        </div>
      </header>

      <section className="soft-card space-y-5 rounded-3xl p-6">
        <h2 className="text-base font-semibold text-zinc-900">
          Choose your segment
        </h2>
        <StationSelect
          stops={trip.stops}
          startStationId={startStationId}
          endStationId={endStationId}
          onStartChange={(id) => {
            setStartStationId(id);
            setSelectedSeatId(null);
          }}
          onEndChange={(id) => {
            setEndStationId(id);
            setSelectedSeatId(null);
          }}
        />
      </section>

      {bookingError !== null && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
        >
          <p className="text-sm font-medium">{bookingError}</p>
        </div>
      )}

      <ConflictBanner
        visible={conflictVisible}
        onDismiss={() => setConflictVisible(false)}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="soft-card space-y-5 rounded-3xl p-6">
          <h2 className="text-base font-semibold text-zinc-900">
            Select a seat
          </h2>
          {!seatsEnabled ? (
            <p className="text-sm text-zinc-500">
              Pick a start and end station above to see available seats.
            </p>
          ) : seatsLoading ? (
            <LoadingSpinner />
          ) : seatsIsError ? (
            <ErrorBanner
              message={
                seatsError instanceof Error
                  ? seatsError.message
                  : 'Failed to load seats.'
              }
              onRetry={() => refetchSeats()}
            />
          ) : seats.length === 0 ? (
            <EmptyState message="No seats available for this bus." />
          ) : (
            <SeatMap
              seats={seats}
              selectedSeatId={selectedSeatId}
              onSelect={(id) => {
                if (id === -1) {
                  setSelectedSeatId(null);
                } else {
                  setSelectedSeatId(id);
                }
              }}
            />
          )}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingSummaryPanel
            startStation={startStation}
            endStation={endStation}
            selectedSeat={selectedSeat}
            isAuthenticated={isAuthenticated}
            tripId={tripId}
            onConfirm={handleConfirm}
            isSubmitting={createBookingMutation.isPending}
          />
        </aside>
      </div>
    </div>
  );
}
