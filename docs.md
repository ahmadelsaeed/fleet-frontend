# Frontend Build Spec — Fleet Management / Bus Booking System (Next.js)

> **How to use this file:** Feed this whole document to an AI coding agent as
> the spec for generating the **Next.js + TypeScript frontend**. It assumes
> the backend described in `BACKEND_BUILD_SPEC.md` already exists and is
> reachable over HTTP. Treat the API contract in Section 3 as authoritative —
> build pages/components to match it, don't invent different endpoints or
> response shapes.

## 1. What to Build

A Next.js (App Router) + TypeScript web app that lets a user:
1. Register / log in.
2. Browse trips and their routes.
3. Pick a trip, a start station, and an end station.
4. See a seat map with available/unavailable seats for that exact segment.
5. Book an available seat.
6. Handle the case where the seat they picked gets booked by someone else
   between "load seats" and "submit booking" — show a clear message, refetch
   seats, clear the stale selection.
7. View and cancel their own bookings.

This is a **separate project** from the Laravel backend — it only talks to
it over HTTP/JSON, via `NEXT_PUBLIC_API_URL` (e.g.
`http://localhost:8000/api`). Enable CORS on the backend for the frontend's
origin; that's a backend concern, not something to work around here.

Keep it simple: don't add pages, state layers, or abstractions beyond what's
listed below.

## 2. Tech Stack & Conventions

- **Next.js (App Router)** + **TypeScript**.
- **TanStack Query (React Query)** for all server state (trips, stations,
  seats, bookings) — it directly solves the "refetch seats after a 409
  conflict" requirement via `queryClient.invalidateQueries`.
- Plain React state (`useState`) for local UI state (selected station IDs,
  selected seat, form inputs) — don't put this in React Query.
- A single typed API client module (`lib/api.ts` or `lib/api/*.ts`) — no
  component should call `fetch` directly.
- Auth token stored via an httpOnly-friendly pattern: since this is a pure
  SPA-style client talking to a token API (Sanctum personal access tokens,
  per the backend spec), store the token in memory + `localStorage` (or a
  cookie if you prefer SSR-aware auth checks) and attach it as
  `Authorization: Bearer {token}` in the API client. Document whichever you
  pick.
- Tailwind CSS (or CSS Modules) for styling — either is fine, pick one and
  be consistent.
- Semantic HTML and basic accessibility throughout (labeled inputs, seat
  buttons with `aria-pressed`/`aria-disabled`, focus states).

## 3. API Contract to Consume

Base URL: `NEXT_PUBLIC_API_URL` (e.g. `/api`). All bodies/responses are JSON.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | no | `{ name, email, phone, password, password_confirmation }` → user + token |
| POST | `/login` | no | `{ email, password }` → user + token |
| POST | `/logout` | yes | Revoke current token |
| GET | `/me` | yes | Current user |
| GET | `/stations` | no | `[{ id, name }]` |
| GET | `/trips` | no | `[{ id, code, date, bus, stops: [{ id, sequence_order, station }] }]` |
| GET | `/trips/{id}` | no | Same shape as above, single trip |
| GET | `/trips/{id}/available-seats?start_station_id=&end_station_id=` | no | `{ trip_id, start_station_id, end_station_id, seats: [{ seat_id, seat_number, is_available }] }` |
| POST | `/bookings` | yes | `{ trip_id, seat_id, start_station_id, end_station_id }` → booking (201) or 409/422 |
| GET | `/bookings` | yes | Authenticated user's bookings |
| GET | `/bookings/{id}` | yes | Single booking detail |
| DELETE | `/bookings/{id}` | yes | Cancel a booking |

Error shape to handle everywhere: Laravel's standard
`{ "message": string, "errors"?: Record<string, string[]> }`, plus these
specific statuses to branch on:
- `401` → not authenticated → redirect to `/login`.
- `404` → trip/booking not found.
- `409` → **booking conflict** — the seat became unavailable; this is the
  special case in Section 6.
- `422` → validation error — show field-level messages from `errors`.

## 4. Pages / Routes

| Route | Auth required? | Purpose |
|---|---|---|
| `/register` | no (redirect away if already logged in) | Registration form: name, email, phone, password, confirm password |
| `/login` | no (redirect away if already logged in) | Login form: email, password |
| `/` (trip list) | no | Browse all trips; each card shows route summary (e.g. "Cairo → Al Fayyum → Al Minya → Asyut") and date; clicking a trip goes to `/trips/[id]` |
| `/trips/[id]` (trip detail + booking) | booking action requires auth; browsing doesn't | Select start/end station (constrained to that trip's stops, start before end), fetch seat map, select a seat, submit booking. If not logged in and user tries to book, redirect to `/login?redirect=/trips/[id]` |
| `/bookings` (my bookings) | yes | List the current user's bookings (trip, route segment, seat, date); link to detail; cancel action |
| `/bookings/[id]` | yes | Single booking detail / confirmation view (also used as the post-booking success screen, e.g. redirect here after a successful `POST /bookings`) |
| Root layout | — | Header/nav showing app name, login/register links when logged out, "My Bookings" + logout when logged in |

Don't build additional pages (no admin, no trip-creation UI, no payment) —
out of scope per the task.

## 5. Page-by-Page Requirements

### `/register`
- Fields: name, email, phone, password, password confirmation. Client-side
  required/format checks, but the **source of truth for validation errors is
  the API's 422 response** — render field errors from `errors.{field}`.
- On success: store token + user, redirect to `/` (or the original
  `redirect` query param if present).
- Loading state on submit button; disable while in flight.

### `/login`
- Fields: email, password.
- On success: store token + user, redirect to `/` (or `redirect` param).
- On 422/401: show a single clear error ("Invalid email or password.").

### `/` — Trip List
- `useQuery` fetching `/trips`.
- Loading skeleton, empty state ("No trips available"), error state with
  retry.
- Each trip card: route as an ordered chain of station names, trip date,
  "View seats" link to `/trips/[id]`.

### `/trips/[id]` — Trip Detail & Booking
This is the core page. Structure:

1. **Route header** — ordered stations for this trip (from `GET
   /trips/{id}`), so the user sees the whole route before picking a segment.
2. **Segment selector** — two `<select>`s (start station, end station)
   populated only from this trip's own stops, in route order. Disable/filter
   the end-station options to only those *after* the chosen start station
   (mirrors the backend's own order validation, so users rarely even trigger
   a 422).
3. **Seat map** — once both stations are chosen, `useQuery` fetches
   `/trips/{id}/available-seats?start_station_id=&end_station_id=`. Render
   all seats in a grid; visually distinct styles for available vs.
   unavailable (color + `aria-disabled`, not color alone). Clicking an
   available seat selects it (single selection); clicking it again
   deselects.
4. **Booking panel** — shows the selected segment + seat number, a "Confirm
   Booking" button. Disabled until a seat is selected. If not authenticated,
   button reads "Log in to book" and clicking it redirects to
   `/login?redirect=/trips/[id]`.
5. **States**: loading spinner while seats load; empty state if a bus somehow
   has zero seats; error state with retry if the seats fetch fails;
   validation error banner if the backend rejects the segment (422, e.g.
   stations swapped) — surface the exact backend message.

### `/bookings` — My Bookings
- `useQuery` fetching `/bookings` (auth required — redirect to `/login` on
  401).
- List each booking: trip code/date, route segment (start → end station
  names), seat number, a "Cancel" button (calls `DELETE /bookings/{id}`,
  then invalidates the bookings query).
- Empty state: "You haven't booked any trips yet" with a link to `/`.

### `/bookings/[id]` — Booking Detail / Confirmation
- Single booking's full detail: trip, route segment, seat, booked-at
  timestamp.
- Used both as a direct detail page and as the redirect target right after a
  successful booking (so `POST /bookings` success handler routes to
  `/bookings/{newBooking.id}`).
- Cancel action available here too.

## 6. The Booking-Conflict Flow (critical — implement exactly this)

On `/trips/[id]`, when the user clicks "Confirm Booking":

1. Call `POST /bookings` with the selected `trip_id`, `seat_id`,
   `start_station_id`, `end_station_id`.
2. **On success (201):** redirect to `/bookings/{id}` with a success toast.
3. **On conflict (409):**
   - Show a clear, non-technical banner: *"This seat was just booked by
     someone else. Please choose another seat."*
   - Immediately `queryClient.invalidateQueries` (or refetch) the
     available-seats query for this trip/segment, so the seat map reflects
     current server state.
   - Clear the selected-seat local state (don't leave the now-taken seat
     looking "selected").
   - Keep the user on the same page with the refreshed seat map — don't
     bounce them back to the trip list.
4. **On validation error (422):** show the backend's message inline near the
   station selectors (e.g. "start station must come before end station").
5. **On auth error (401):** redirect to `/login?redirect=/trips/[id]`,
   preserving their station selections if reasonably easy (e.g. via query
   params), so they don't have to re-pick everything after logging in.

The backend is always the source of truth — never mark a seat as booked
optimistically in the UI before the API confirms it.

## 7. Component Breakdown (reusable, keep them small)

- `Header` / `NavBar` — auth-aware nav.
- `TripCard`, `TripList`
- `RouteBreadcrumb` (renders an ordered chain of station names)
- `StationSelect` (start/end dropdowns, trip-scoped)
- `SeatMap`, `Seat` (single seat button, available/unavailable/selected
  states)
- `BookingSummaryPanel` (selected segment + seat + confirm button)
- `BookingCard`, `BookingList` (used on `/bookings`)
- `LoadingSpinner`, `EmptyState`, `ErrorBanner` — shared across pages, don't
  reimplement per page
- `AuthForm` primitives shared by `/login` and `/register` (labeled input +
  error message component)

## 8. API Client Layer

One typed module per resource, e.g.:

```ts
// lib/api/trips.ts
export type Station = { id: number; name: string };
export type TripStop = { id: number; sequence_order: number; station: Station };
export type Trip = { id: number; code: string; date: string; stops: TripStop[] };

export async function getTrips(): Promise<Trip[]> { /* fetch + auth header */ }
export async function getTrip(id: number): Promise<Trip> { /* ... */ }
export async function getAvailableSeats(
  tripId: number, startStationId: number, endStationId: number
): Promise<{ seat_id: number; seat_number: number; is_available: boolean }[]> { /* ... */ }
```

```ts
// lib/api/bookings.ts
export type Booking = {
  id: number; trip: Trip; seat: { id: number; seat_number: number };
  start_stop: TripStop; end_stop: TripStop; created_at: string;
};

export async function createBooking(input: {
  trip_id: number; seat_id: number; start_station_id: number; end_station_id: number;
}): Promise<Booking> { /* throws a typed ApiError with .status on non-2xx */ }

export async function getMyBookings(): Promise<Booking[]> { /* ... */ }
export async function cancelBooking(id: number): Promise<void> { /* ... */ }
```

```ts
// lib/api/auth.ts
export async function register(input: {...}): Promise<{ user: User; token: string }> {}
export async function login(input: {...}): Promise<{ user: User; token: string }> {}
export async function logout(): Promise<void> {}
export async function getMe(): Promise<User> {}
```

A single shared `apiFetch` helper attaches the base URL, JSON headers, the
bearer token when present, and normalizes errors into a typed `ApiError { status: number; message: string; errors?: Record<string, string[]> }`.

## 9. Automated Tests (minimum required coverage)

Using Jest/Vitest + React Testing Library, with the API client mocked:

- Seat map renders available seats and unavailable seats with visibly
  distinct, testable states (e.g. `aria-disabled`).
- Successful booking flow: select segment → select seat → confirm → redirect
  to booking detail.
- Loading state renders while seats/trips are fetching.
- API error state renders (e.g. seats fetch fails) with a retry option.
- **Booking conflict flow**: mock `POST /bookings` to return 409, assert the
  conflict message appears, the seats query is refetched, and the seat
  selection is cleared.
- Login/register form validation error rendering from a mocked 422 response.

## 10. Explicitly Out of Scope (don't build these)

- No SSR-specific auth strategies beyond what's needed for a client-rendered
  SPA-style flow — this is a client app hitting a token API, not a
  server-rendered account system.
- No payment step, no admin/trip-management UI, no multi-seat booking in one
  request (one seat per booking, per the API contract).
- No offline support, no PWA features.