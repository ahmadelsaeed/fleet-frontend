import type {
  AuthResponse,
  AvailableSeatsResponse,
  Booking,
  Bus,
  PaginatedResponse,
  PaginationMeta,
  SeatData,
  Station,
  Trip,
  TripStop,
  User,
} from './api/types';

type RawStation = { id: number; name: string };
type RawTripStop = {
  id: number;
  sequence_order: number;
  station: RawStation;
};
type RawBus = {
  id: number;
  plate_number?: string;
  name?: string;
  seats_count?: number;
};
type RawTrip = {
  id: number;
  code: string;
  date?: string;
  trip_date?: string;
  travel_date?: string;
  departure_date?: string;
  start_time?: string;
  startTime?: string;
  end_time?: string;
  endTime?: string;
  bus: RawBus;
  stops?: RawTripStop[];
  trip_stops?: RawTripStop[];
};
type RawSeat = {
  seat_id: number;
  seat_number: number;
  is_available: boolean;
};
type RawAvailableSeats = {
  trip_id: number;
  start_station_id: number;
  end_station_id: number;
  seats: RawSeat[];
};
type RawBooking = {
  id: number;
  trip: RawTrip;
  seat: { id: number; seat_number: number };
  start_stop: RawTripStop;
  end_stop: RawTripStop;
  created_at: string;
};
type RawUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
};
type RawAuthResponse = {
  user: RawUser;
  token: string;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function normalizeStation(raw: RawStation): Station {
  return { id: raw.id, name: raw.name };
}

function normalizeTripStop(raw: RawTripStop): TripStop {
  return {
    id: raw.id,
    sequence_order: raw.sequence_order,
    station: normalizeStation(raw.station),
  };
}

function normalizeBus(raw: RawBus): Bus {
  return {
    id: raw.id,
    name: raw.name ?? raw.plate_number ?? `Bus #${raw.id}`,
    seats_count: raw.seats_count,
  };
}

function normalizeTrip(raw: RawTrip): Trip {
  const stops = raw.stops ?? raw.trip_stops ?? [];
  const tripDate =
    raw.date ?? raw.trip_date ?? raw.travel_date ?? raw.departure_date ?? '';

  return {
    id: raw.id,
    code: raw.code,
    date: tripDate,
    startTime: raw.start_time ?? raw.startTime,
    endTime: raw.end_time ?? raw.endTime,
    bus: normalizeBus(raw.bus),
    stops: stops.map(normalizeTripStop),
  };
}

function normalizeSeat(raw: RawSeat): SeatData {
  return {
    seat_id: raw.seat_id,
    seat_number: raw.seat_number,
    is_available: raw.is_available,
  };
}

function normalizeAvailableSeats(
  raw: RawAvailableSeats,
): AvailableSeatsResponse {
  return {
    trip_id: raw.trip_id,
    start_station_id: raw.start_station_id,
    end_station_id: raw.end_station_id,
    seats: raw.seats.map(normalizeSeat),
  };
}

function normalizeBooking(raw: RawBooking): Booking {
  return {
    id: raw.id,
    trip: normalizeTrip(raw.trip),
    seat: { id: raw.seat.id, seat_number: raw.seat.seat_number },
    start_stop: normalizeTripStop(raw.start_stop),
    end_stop: normalizeTripStop(raw.end_stop),
    created_at: raw.created_at,
  };
}

function normalizeUser(raw: RawUser): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
  };
}

// function normalizeAuthResponse(raw: RawAuthResponse): AuthResponse {
//   return {
//     user: normalizeUser(raw.user),
//     token: raw.token,
//   };
// }

function unwrapEnvelope<T>(payload: unknown): T | undefined {
  if (payload === null || payload === undefined) return undefined;
  if (typeof payload !== 'object') return undefined;
  const obj = payload as Record<string, unknown>;

  const nestedKeys = ['data', 'trip', 'booking', 'user', 'item'];
  for (const key of nestedKeys) {
    const value = obj[key];
    if (value !== null && value !== undefined && typeof value === 'object') {
      return value as T;
    }
  }

  return payload as T;
}

function unwrapEnvelopeArray<T>(payload: unknown): T[] {
  if (payload === null || payload === undefined) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  if ('data' in obj && typeof obj.data === 'object' && obj.data !== null) {
    const inner = obj.data as Record<string, unknown>;
    for (const key of Object.keys(inner)) {
      const val = inner[key];
      if (Array.isArray(val)) return val as T[];
    }
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

export function unwrapArray<T>(payload: unknown): T[] {
  return unwrapEnvelopeArray<T>(payload);
}

export function unwrapItem<T>(payload: unknown): T | undefined {
  const obj = payload as Record<string, unknown> | null | undefined;
  if (!obj || typeof obj !== 'object') return undefined;

  const nestedKeys = ['trip', 'booking', 'user', 'item', 'data'];
  for (const key of nestedKeys) {
    const value = obj[key];
    if (value !== null && value !== undefined && typeof value === 'object') {
      return value as T;
    }
  }

  return payload as T;
}

export function unwrapSeats(payload: unknown): AvailableSeatsResponse | undefined {
  return normalizeAvailableSeatsResponse(payload) ?? undefined;
}

export function normalizeTripsResponse(payload: unknown): Trip[] {
  const rawTrips = unwrapEnvelopeArray<RawTrip>(payload);
  return rawTrips.map(normalizeTrip);
}

export function normalizePaginatedTripsResponse(
  payload: unknown,
): PaginatedResponse<Trip> {
  const trips = normalizeTripsResponse(payload);
  let meta: PaginationMeta | null = null;

  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (p.meta && typeof p.meta === 'object') {
      const m = p.meta as Record<string, unknown>;
      const page = m.page;
      const totalPages = m.total_pages;
      if (typeof page === 'number' && typeof totalPages === 'number') {
        meta = { page, total_pages: totalPages };
      }
    }
  }

  return { data: trips, meta };
}

export function normalizeTripResponse(payload: unknown): Trip | undefined {
  const data = unwrapEnvelope(payload);
  if (data === undefined) return undefined;
  const d = data as Record<string, unknown>;
  if ('trip' in d && typeof d.trip === 'object' && d.trip !== null) {
    return normalizeTrip(d.trip as RawTrip);
  }
  if ('id' in d && 'code' in d) {
    return normalizeTrip(d as RawTrip);
  }
  return undefined;
}

export function normalizeAvailableSeatsResponse(
  payload: unknown,
): AvailableSeatsResponse | null {
  const data = unwrapEnvelope(payload);
  if (data === undefined) return null;
  const d = data as Record<string, unknown>;
  if ('seats' in d && Array.isArray(d.seats)) {
    return normalizeAvailableSeats(d as RawAvailableSeats);
  }
  for (const key of Object.keys(d)) {
    const val = (d as Record<string, unknown>)[key];
    if (
      val &&
      typeof val === 'object' &&
      'seats' in (val as Record<string, unknown>) &&
      Array.isArray((val as Record<string, unknown>).seats)
    ) {
      return normalizeAvailableSeats(val as RawAvailableSeats);
    }
  }
  return null;
}

export function normalizeBookingsResponse(payload: unknown): Booking[] {
  const rawBookings = unwrapEnvelopeArray<RawBooking>(payload);
  return rawBookings.map(normalizeBooking);
}

export function normalizeBookingResponse(payload: unknown): Booking | undefined {
  const data = unwrapEnvelope(payload);
  if (data === undefined) return undefined;
  const d = data as Record<string, unknown>;

  if ('data' in d && d.data !== null && typeof d.data === 'object') {
    const nested = d.data as Record<string, unknown>;
    if ('booking' in nested && typeof nested.booking === 'object' && nested.booking !== null) {
      return normalizeBooking(nested.booking as RawBooking);
    }
  }

  if ('booking' in d && typeof d.booking === 'object' && d.booking !== null) {
    return normalizeBooking(d.booking as RawBooking);
  }
  if ('id' in d && 'trip' in d && typeof d.trip === 'object') {
    return normalizeBooking(d as RawBooking);
  }
  return undefined;
}

export function normalizeAuthResponse(payload: unknown): AuthResponse | undefined {
  const data = unwrapEnvelope(payload);
  if (data === undefined) return undefined;
  const d = data as Record<string, unknown>;

  if ('data' in d && d.data !== null && typeof d.data === 'object') {
    const nested = d.data as Record<string, unknown>;
    if ('user' in nested && 'token' in nested && typeof nested.token === 'string') {
      return {
        user: normalizeUser(nested.user as RawUser),
        token: nested.token,
      };
    }
  }

  if ('user' in d && 'token' in d && typeof d.token === 'string') {
    return {
      user: normalizeUser(d.user as RawUser),
      token: d.token,
    };
  }

  return undefined;
}

export function unwrapUser(payload: unknown): User | undefined {
  const data = unwrapEnvelope(payload);
  if (data === undefined) return undefined;
  const d = data as Record<string, unknown>;
  if ('user' in d && typeof d.user === 'object' && d.user !== null) {
    return normalizeUser(d.user as RawUser);
  }
  if ('id' in d && 'name' in d && 'email' in d) {
    return normalizeUser(d as RawUser);
  }
  return undefined;
}

export function createdBooking(payload: unknown): Booking | undefined {
  return normalizeBookingResponse(payload);
}
