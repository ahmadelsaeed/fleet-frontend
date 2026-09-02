export const queryKeys = {
  trips: () => ['trips'] as const,
  trip: (id: number) => ['trips', id] as const,
  availableSeats: (tripId: number, startId: number, endId: number) =>
    ['seats', tripId, startId, endId] as const,
  myBookings: () => ['bookings'] as const,
  booking: (id: number) => ['bookings', id] as const,
};
