import { apiFetch } from './client';
import type { Trip, AvailableSeatsResponse, PaginatedResponse } from './types';
import { normalizePaginatedTripsResponse, normalizeTripResponse } from '../response';

/**
 * Fetches all trips from the backend.
 * GET /trips → Trip[]
 *
 * Requirements: 7.1
 */
export async function getTrips(page = 1): Promise<PaginatedResponse<Trip>> {
  const params = new URLSearchParams({ page: String(page) });
  const response = await apiFetch<unknown>(`/trips?${params.toString()}`);
  return normalizePaginatedTripsResponse(response);
}

/**
 * Fetches a single trip by ID.
 * GET /trips/{id} → Trip
 *
 * Requirements: 8.1
 */
export async function getTrip(id: number): Promise<Trip> {
  const response = await apiFetch<unknown>(`/trips/${id}`);
  const trip = normalizeTripResponse(response);
  if (!trip) {
    throw new Error('Trip not found.');
  }
  return trip;
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
