import { apiFetch } from './client';
import type { Booking } from './types';
import { normalizeBookingResponse } from '../response';

/**
 * Creates a new booking.
 * POST /bookings → Booking (201)
 *
 * Requirements: 8.11
 */
export function createBooking(data: {
  trip_id: number;
  seat_id: number;
  start_station_id: number;
  end_station_id: number;
}): Promise<Booking> {
  return apiFetch<unknown>('/bookings', {
    method: 'POST',
    body: data,
  }).then((payload) => {
    const booking = normalizeBookingResponse(payload);
    if (!booking) {
      throw new Error('Invalid booking response.');
    }
    return booking;
  });
}

/**
 * Fetches all bookings belonging to the authenticated user.
 * GET /bookings → Booking[]
 *
 * Requirements: 12.1
 */
export function getMyBookings(): Promise<Booking[]> {
  return apiFetch<Booking[]>('/bookings');
}

/**
 * Fetches a single booking by ID.
 * GET /bookings/{id} → Booking
 *
 * Requirements: 13.1
 */
export function getBooking(id: number): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}`);
}

/**
 * Cancels a booking by ID.
 * DELETE /bookings/{id} → 204 void
 *
 * Requirements: 13.4
 */
export function cancelBooking(id: number): Promise<void> {
  return apiFetch<void>(`/bookings/${id}`, {
    method: 'DELETE',
  });
}
