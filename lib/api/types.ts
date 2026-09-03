export type Station = {
  id: number;
  name: string;
};

export type TripStop = {
  id: number;
  sequence_order: number;
  station: Station;
};

export type Bus = {
  id: number;
  name: string;
  seats_count?: number;
};

export type PaginationMeta = {
  page: number;
  total_pages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta | null;
};

export type Trip = {
  id: number;
  code: string;
  date: string; // ISO date string
  startTime?: string;
  endTime?: string;
  bus: Bus;
  stops: TripStop[];
};

export type SeatData = {
  seat_id: number;
  seat_number: number;
  is_available: boolean;
};

export type AvailableSeatsResponse = {
  trip_id: number;
  start_station_id: number;
  end_station_id: number;
  seats: SeatData[];
};

export type Booking = {
  id: number;
  trip: Trip;
  seat: { id: number; seat_number: number };
  start_stop: TripStop;
  end_stop: TripStop;
  created_at: string; // ISO datetime string
};

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};

/**
 * Describes the shape of a normalized API error.
 * Use this as a type annotation when catching errors and narrowing to ApiError.
 */
export interface ApiErrorShape {
  status: number; // 0 for network failures, HTTP status otherwise
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Thrown by the ApiClient for all non-2xx responses and network failures.
 * Extends Error so it integrates with standard JS error handling and can be
 * caught with `instanceof ApiError`.
 *
 * Satisfies `ApiErrorShape` structurally.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public override message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    // Restore prototype chain in environments that transpile classes to ES5
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
