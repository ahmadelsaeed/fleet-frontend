import { apiFetch } from './client';
import type { Trip, AvailableSeatsResponse } from './types';

/**
 * Fetches all trips from the backend.
 * GET /trips → Trip[]
 *
 * Requirements: 7.1
 */
export function getTrips(): Promise<Trip[]> {
  return apiFetch<Trip[]>('/trips');
}

/**
 * Fetches a single trip by ID.
 * GET /trips/{id} → Trip
 *
 * Requirements: 8.1
 */
export function getTrip(id: number): Promise<Trip> {
  return apiFetch<Trip>(`/trips/${id}`);
}

/**
 * Fetches available seats for a trip segment.
 * GET /trips/{id}/available-seats?start_station_id={startId}&end_station_id={endId}
 * → AvailableSeatsResponse
 *
 * Requirements: 8.4
 */
export function getAvailableSeats(
  tripId: number,
  startStationId: number,
  endStationId: number,
): Promise<AvailableSeatsResponse> {
  const params = new URLSearchParams({
    start_station_id: String(startStationId),
    end_station_id: String(endStationId),
  });
  return apiFetch<AvailableSeatsResponse>(
    `/trips/${tripId}/available-seats?${params.toString()}`,
  );
}
