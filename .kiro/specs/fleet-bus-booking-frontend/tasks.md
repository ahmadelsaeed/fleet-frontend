# Implementation Plan: Fleet Bus Booking Frontend

## Overview

Implement a Next.js 16 (App Router) + TypeScript frontend for the Fleet Management / Bus Booking System. The implementation proceeds from the data/auth layer outward to UI components, then pages, and finally tests. TanStack Query owns all server state; a centralized ApiClient is the sole contact point with the Laravel backend.

## Tasks

- [~] 1. Install dependencies and configure the project
  - Add TanStack Query (`@tanstack/react-query`), `fast-check`, Vitest and its plugins (`vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `vite-tsconfig-paths`), and `msw` as dev dependencies via pnpm
  - Create `vitest.config.ts` with `@vitejs/plugin-react`, `vite-tsconfig-paths`, jsdom environment, and global test setup
  - Create `vitest.setup.ts` that imports `@testing-library/jest-dom`
  - Create `.env.local` placeholder with `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
  - _Requirements: 1.3, 1.7, 17 (tooling)_

- [x] 2. Implement the API type definitions and ApiClient core
  - [x] 2.1 Create `lib/api/types.ts` with all exported TypeScript types: `Station`, `TripStop`, `Bus`, `Trip`, `SeatData`, `AvailableSeatsResponse`, `Booking`, `User`, `AuthResponse`, `ApiError` (as both an interface and a class)
    - _Requirements: 1.4_

  - [x] 2.2 Create `lib/api/client.ts` implementing `ApiError` class and `apiFetch` helper
    - `ApiError` extends `Error` with `status: number`, `message: string`, `errors?: Record<string, string[]>`
    - `apiFetch` throws before dispatch when `NEXT_PUBLIC_API_URL` is missing (Req 1.7)
    - Attaches `Authorization: Bearer {token}` when a token is in the AuthStore (Req 1.2)
    - Sets `Content-Type: application/json` for requests with a body (Req 1.6)
    - Throws `ApiError(0, ...)` for network failures (Req 1.8)
    - Throws `ApiError(status, ...)` for non-2xx responses, parsing body when possible (Req 1.4)
    - Calls `clearToken()` and triggers `/login` navigation on 401 (Req 1.5)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 3. Implement the AuthStore and API resource modules
  - [x] 3.1 Create `lib/auth.ts` implementing the module-level AuthStore singleton
    - `AUTH_STORAGE_KEY = 'fleet_auth_token'`
    - `initAuthStore()` reads from `localStorage`, falls back to null on error (Req 2.2, 2.3, 2.6)
    - `getToken()`, `setToken(token)` (writes memory + localStorage), `clearToken()` (clears both) (Req 2.1, 2.4)
    - All localStorage operations are wrapped in try/catch (Req 2.6)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 3.2 Create `lib/queryKeys.ts` with the `queryKeys` factory object
    - `trips`, `trip(id)`, `availableSeats(tripId, startId, endId)`, `myBookings`, `booking(id)`
    - _Requirements: 9.3 (seat invalidation)_

  - [x] 3.3 Create `lib/api/auth.ts` — `register`, `login`, `logout`, `getMe` using `apiFetch`
    - _Requirements: 3.2, 4.2, 5.1_

  - [x] 3.4 Create `lib/api/trips.ts` — `getTrips`, `getTrip`, `getAvailableSeats` using `apiFetch`
    - _Requirements: 7.1, 8.1, 8.4_

  - [x] 3.5 Create `lib/api/bookings.ts` — `createBooking`, `getMyBookings`, `getBooking`, `cancelBooking` using `apiFetch`
    - _Requirements: 8.11, 12.1, 13.1, 13.4_


- [~] 4. Checkpoint — Core layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement the root layout and AuthProvider
  - [-] 5.1 Create `lib/providers.tsx` (marked `'use client'`) exporting `Providers` component
    - Wraps children in `QueryClientProvider` with a stable `QueryClient` instance
    - Wraps children in an `AuthProvider` context that calls `initAuthStore()` on mount and exposes `token`, `setToken`, `clearToken`, and `isAuthenticated` to the component tree
    - _Requirements: 2.2, 6.1_

  - [~] 5.2 Update `app/layout.tsx` to wrap all children in `<Providers>` and render `<NavBar>`
    - Import and render `NavBar` inside the providers wrapper
    - _Requirements: 6.1_

- [ ] 6. Implement shared UI components
  - [~] 6.1 Create `components/ui/LoadingSpinner.tsx`
    - Renders `<div role="status" aria-label="Loading">` with a visible spinner (Tailwind `animate-spin`)
    - _Requirements: 15.1, 17.3_

  - [~] 6.2 Create `components/ui/ErrorBanner.tsx`
    - Props: `{ message: string; onRetry?: () => void }`
    - When `onRetry` provided, renders an accessible "Retry" button that calls it
    - _Requirements: 15.2, 17.4_

  - [~] 6.3 Create `components/ui/EmptyState.tsx`
    - Props: `{ message: string; children?: ReactNode }`
    - _Requirements: 15.3_

  - [~] 6.4 Create `components/ui/Toast.tsx`
    - Props: `{ message: string; type: 'success' | 'error'; timeoutMs?: number; onDismiss: () => void }`
    - Auto-dismisses after `timeoutMs` (default 5000 ms) via `useEffect`; dismissible before timeout
    - _Requirements: 15.4, 10.2, 10.3_

  - [ ]* 6.5 Write unit tests for shared UI components
    - `LoadingSpinner`: renders element with `role="status"`
    - `ErrorBanner`: renders retry button with accessible label when `onRetry` provided
    - `Toast`: auto-dismisses after configurable timeout; user can dismiss before timeout
    - _Requirements: 15.1, 15.2, 15.4, 17.3, 17.4_

- [ ] 7. Implement NavBar
  - [~] 7.1 Create `components/NavBar.tsx` (marked `'use client'`)
    - Reads auth state from `AuthProvider` context
    - Unauthenticated: links to `/login` and `/register`; app name links to `/`
    - Authenticated: app name link to `/`, link to `/bookings`, logout button
    - Logout handler: calls `POST /logout`, clears AuthStore token (regardless of API result), navigates to `/login`; disables logout button while in flight
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8. Implement authentication pages
  - [~] 8.1 Create `app/register/page.tsx` and `components/auth/RegisterForm.tsx` (marked `'use client'`)
    - Fields: name, email, phone, password, password confirmation; all with `<label>` + `id` + `aria-describedby` on error (Req 16.1)
    - Client-side password match check before submit (Req 3.7)
    - On submit: calls `register`, stores token, redirects to `/`; disables button and shows spinner while in-flight (Req 3.2, 3.5, 3.6)
    - On 422: displays field-level errors from `errors` map (Req 3.4)
    - On other errors: displays generic error, re-enables button (Req 3.8)
    - Already-authenticated users redirected to `/` (Req 3.3)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 16.1_

  - [~] 8.2 Create `app/login/page.tsx` and `components/auth/LoginForm.tsx` (marked `'use client'`)
    - Fields: email (type email, max 254), password (type password, max 128); with `<label>` + `id` + `aria-describedby` (Req 16.1)
    - On submit: calls `login`, stores token, redirects to `redirect` query param (if relative) or `/` (Req 4.2, 4.6, 4.7)
    - On 401/422: single inline error "Invalid email or password.", re-enables button (Req 4.4)
    - On other errors: error message, re-enables button, does not clear email field (Req 4.5)
    - While in flight: disables submit button, shows loading indicator (Req 4.8)
    - Already-authenticated users redirected to `/` (Req 4.3)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 16.1_

- [ ] 9. Implement trip browsing components and page
  - [~] 9.1 Create `components/trips/RouteBreadcrumb.tsx`
    - Props: `{ stops: TripStop[] }`
    - Renders ordered station names separated by `→`; fewer than 2 stops renders without arrows (Req 7.7)
    - _Requirements: 7.5, 7.7_

  - [~] 9.2 Create `components/trips/TripCard.tsx`
    - Props: `{ trip: Trip }`
    - Renders route via `RouteBreadcrumb` and trip date; click navigates to `/trips/[id]` (Req 7.6)
    - _Requirements: 7.5, 7.6_

  - [~] 9.3 Create `app/page.tsx` trip list page (marked `'use client'`)
    - Uses `useQuery(queryKeys.trips(), getTrips)` to fetch trips
    - Loading: renders `<LoadingSpinner>`; error: renders `<ErrorBanner>` with retry; empty: renders `<EmptyState>` (Req 7.2, 7.3, 7.4)
    - Renders a `<TripCard>` for each trip (Req 7.5)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 10. Implement trip detail components
  - [~] 10.1 Create `components/trips/StationSelect.tsx`
    - Props: `{ stops: TripStop[]; startStationId: number | null; endStationId: number | null; onStartChange; onEndChange }`
    - Start select: all stops in `sequence_order` ascending
    - End select: only stops with `sequence_order` strictly greater than selected start's `sequence_order` (Req 8.3)
    - _Requirements: 8.2, 8.3_

  - [~] 10.3 Create `components/seats/Seat.tsx`
    - Props: `{ seat: SeatData; isSelected: boolean; onClick: () => void }`
    - Renders `<button>` with `aria-pressed="true/false"` and `aria-disabled="true/false"` (Req 16.2)
    - Unavailable seats: click is a no-op; visual distinction via Tailwind (color + cursor, not color alone) (Req 8.7, 16.4)
    - _Requirements: 8.7, 8.8, 16.2, 16.4_

  - [~] 10.4 Create `components/seats/SeatMap.tsx`
    - Props: `{ seats: SeatData[]; selectedSeatId: number | null; onSelect: (id: number) => void }`
    - Container has `aria-label="Seat selection"` (Req 16.2)
    - Renders a grid of `<Seat>` buttons (Req 8.7)
    - _Requirements: 8.7, 8.8, 16.2_

- [ ] 11. Implement booking UI components
  - [~] 11.1 Create `components/booking/ConflictBanner.tsx`
    - Props: `{ visible: boolean; onDismiss: () => void }`
    - Prominent non-technical message: "This seat was just booked by someone else. Please choose another seat."
    - Auto-dismisses after 8 seconds via `useEffect`; user can dismiss early (Req 9.1, 9.2)
    - _Requirements: 9.1, 9.2_

  - [~] 11.2 Create `components/booking/BookingSummaryPanel.tsx`
    - Props: `{ startStation, endStation, selectedSeat, isAuthenticated, tripId, onConfirm, isSubmitting }`
    - Authenticated + seat selected: "Confirm Booking" button enabled
    - Authenticated + no seat: button disabled
    - Unauthenticated: button labeled "Log in to book", click redirects to `/login?redirect=/trips/[id]` (Req 8.10)
    - _Requirements: 8.9, 8.10, 8.11_

  - [~] 11.3 Create `components/booking/BookingCard.tsx`
    - Props: `{ booking: Booking; onCancel: (id: number) => void; isCancelling: boolean }`
    - Renders: trip code, trip date, start station name → end station name, seat number
    - "Cancel" button shown only when `trip.date` is in the future (Req 12.6)
    - _Requirements: 12.5, 12.6_


- [~] 12. Checkpoint — Components complete
  - Ensure all component tests pass, ask the user if questions arise.

- [ ] 13. Implement the trip detail and booking page (`/trips/[id]`)
  - [~] 13.1 Create `app/trips/[id]/page.tsx` (marked `'use client'`)
    - Fetches trip via `useQuery(queryKeys.trip(id), () => getTrip(id))`
    - Manages local state: `startStationId`, `endStationId`, `selectedSeatId`, `conflictVisible`, `bookingError`
    - Fetches available seats via `useQuery(queryKeys.availableSeats(...), ...)` when both stations are selected (Req 8.4)
    - Renders: `RouteBreadcrumb`, `StationSelect`, `LoadingSpinner`/`ErrorBanner` for seat fetch, `SeatMap`, `BookingSummaryPanel`, `ConflictBanner`
    - Seat click: toggles selection (select/deselect) (Req 8.8)
    - _Requirements: 8.1, 8.2, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

  - [~] 13.2 Implement `createBooking` mutation in the trip detail page
    - On 201: navigate to `/bookings/{newBooking.id}` with `?success=1` (Req 8.13, 10.1)
    - On 409: set `conflictVisible=true`, call `queryClient.invalidateQueries(queryKeys.availableSeats(...))`, set `selectedSeatId=null` (Req 9.1, 9.3, 9.4, 9.5)
    - On 422: display inline error from `errors` or fallback message (Req 11.1, 11.2, 11.3, 11.4)
    - On other errors: display error message, keep seat/segment selection (Req 8.12)
    - _Requirements: 8.11, 8.12, 8.13, 9.1, 9.3, 9.4, 9.5, 9.6, 10.1, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 13.3 Write unit and integration tests for the trip detail page
    - 409 booking conflict flow: mock `POST /bookings` → 409, assert `ConflictBanner` appears, seat map re-renders with refreshed data, previously selected seat no longer has `aria-pressed="true"` (Req 17.5)
    - 422 flow: mock → 422, assert inline error near station selectors, no navigation
    - General error: error message displayed, seat and segment unchanged
    - 201 success: navigates to `/bookings/{id}` (Req 17.2)
    - Loading state during seat fetch: `LoadingSpinner` with `role="status"` (Req 17.3)
    - Error state on seat fetch: `ErrorBanner` with retry button (Req 17.4)
    - _Requirements: 8.12, 8.13, 9.1, 9.3, 9.4, 9.5, 11.1, 11.2, 17.2, 17.3, 17.4, 17.5_

- [ ] 14. Implement the bookings list page (`/bookings`)
  - [~] 14.1 Create `app/bookings/page.tsx` (marked `'use client'`)
    - Redirects unauthenticated users to `/login?redirect=/bookings` (Req 12.2, 14.1, 14.2)
    - Fetches bookings via `useQuery(queryKeys.myBookings(), getMyBookings)`
    - Loading: `<LoadingSpinner>`; error: `<ErrorBanner>` with retry; empty: `<EmptyState message="You haven't booked any trips yet">` with link to `/` (Req 12.3, 12.4, 12.8)
    - Renders a `<BookingCard>` for each booking
    - Cancel action: calls `cancelBooking(id)` via mutation, on success invalidates `queryKeys.myBookings()` (Req 12.7)
    - On cancel failure: displays error message, booking remains in list (Req 12.9)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 14.1, 14.2_

- [ ] 15. Implement the booking detail / confirmation page (`/bookings/[id]`)
  - [~] 15.1 Create `app/bookings/[id]/page.tsx` (marked `'use client'`)
    - Redirects unauthenticated users to `/login?redirect=/bookings/{id}` (Req 13.2, 14.1, 14.2)
    - Fetches booking via `useQuery(queryKeys.booking(id), () => getBooking(id))`
    - Displays: trip code, trip date, start station name, end station name, seat number, `created_at` formatted as human-readable date + time (Req 13.3)
    - 404 response: renders not-found message with link back to `/bookings` (Req 13.6)
    - Cancel action: calls `cancelBooking(id)`, on success navigates to `/bookings` (Req 13.4)
    - Cancel failure: shows error message, stays on page (Req 13.5)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 14.1, 14.2_

  - [~] 15.2 Wire success Toast notification in `/bookings/[id]`
    - When navigated from a successful booking (detect via `?success=1` query param), render `<Toast type="success">` that auto-dismisses after 5 seconds (Req 10.2)
    - Direct navigation (no `?success=1`): no Toast rendered (Req 10.3)
    - _Requirements: 10.2, 10.3_

- [ ] 16. Implement protected route enforcement
  - [~] 16.1 Create `components/ProtectedRoute.tsx` (or a `useProtectedRoute` hook) that reads the AuthStore token and calls `router.push('/login?redirect=' + pathname)` when token is null
    - Used by `/bookings` and `/bookings/[id]` pages
    - 401 responses from the ApiClient already clear the token and trigger navigation (Req 14.3, 14.4)
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

## Notes

- Each task references specific requirements for traceability
- The design document uses TypeScript throughout — all code should be TypeScript
- The 409 conflict flow (Tasks 13.1–13.2) is the most complex and is a first-class concern
- Auth state flows from `lib/auth.ts` (singleton) through `AuthProvider` context to all components; the ApiClient reads the singleton directly (not React state) so it works outside the React tree
- Property-based tests use `fast-check` with `numRuns: 100` minimum
- Checkpoints validate incremental progress at logical boundaries
- The `?success=1` query param approach for the success Toast avoids router-state complexity while satisfying Req 10.2 and 10.3

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "3.2"] },
    { "id": 2, "tasks": ["2.3", "3.1"] },
    { "id": 3, "tasks": ["3.3", "3.4", "3.5"] },
    { "id": 4, "tasks": ["3.6", "5.1"] },
    { "id": 5, "tasks": ["5.2", "6.1", "6.2", "6.3", "6.4"] },
    { "id": 6, "tasks": ["6.5", "7.1", "9.1", "9.2", "10.1", "10.3", "11.1", "11.2", "11.3"] },
    { "id": 7, "tasks": ["7.2", "9.3", "10.2", "10.4", "11.4"] },
    { "id": 8, "tasks": ["8.1", "8.2", "9.4", "10.5"] },
    { "id": 9, "tasks": ["8.3", "13.1", "14.1", "15.1", "16.1"] },
    { "id": 10, "tasks": ["13.2", "15.2"] },
    { "id": 11, "tasks": ["13.3", "14.2", "15.3", "16.2"] }
  ]
}
```
