export const queryKeys = {
  trips: () => ['trips'] as const,
  tripsPage: (page: number) => ['trips', 'list', page] as const,
  trip: (id: number) => ['trips', 'detail', id] as const,
  availableSeats: (tripId: number, startId: number, endId: number) =>
    ['seats', tripId, startId, endId] as const,
  myBookings: () => ['bookings'] as const,
  booking: (id: number) => ['bookings', id] as const,
};
