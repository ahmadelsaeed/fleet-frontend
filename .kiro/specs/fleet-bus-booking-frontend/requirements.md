# Requirements Document

## Introduction

A Next.js (App Router) + TypeScript frontend for a Fleet Management / Bus Booking System. The application allows users to register, log in, browse trips with route information, select travel segments, view a real-time seat map, book seats, and manage their own bookings. The frontend communicates exclusively with a pre-existing Laravel backend over HTTP/JSON, using token-based authentication (Sanctum personal access tokens). A critical requirement is graceful handling of seat booking conflicts when a seat is claimed between the time the seat map loads and the time the user submits a booking.

---

## Glossary

- **App**: The Next.js frontend application.
- **API**: The Laravel backend HTTP/JSON API reachable at `NEXT_PUBLIC_API_URL`.
- **ApiClient**: The typed module (`lib/api/`) that handles all HTTP communication with the API.
- **AuthStore**: The client-side mechanism (memory + `localStorage`) responsible for storing and providing the bearer token and current user.
- **Trip**: A scheduled bus journey with a date, a bus, and an ordered list of stops.
- **TripStop**: A stop on a trip, with a `sequence_order` and an associated `Station`.
- **Station**: A named bus station (`{ id, name }`).
- **Segment**: A pair of (start station, end station) defining the portion of a trip a user wants to travel.
- **SeatMap**: The visual grid showing all seats on a bus and their availability for a selected segment.
- **Seat**: A single bus seat, identified by `seat_id` and `seat_number`, with an `is_available` flag for a given segment.
- **Booking**: A confirmed reservation linking a user to a specific trip, seat, and segment.
- **BookingConflict**: The state where `POST /bookings` returns HTTP 409 because the seat was taken between seat-map load and booking submission.
- **NavBar**: The top-level navigation component rendered in the root layout.
- **QueryClient**: The TanStack Query client instance used for all server-state caching and invalidation.
- **Toast**: A transient notification message shown to the user after an action.

---

## Requirements

### Requirement 1: API Client and Error Handling

**User Story:** As a developer, I want a centralized, typed API client module, so that all components communicate with the backend consistently and errors are normalized into a predictable shape.

#### Acceptance Criteria

1. THE ApiClient SHALL expose typed functions for every endpoint defined in the API contract: `register`, `login`, `logout`, `getMe`, `getStations`, `getTrips`, `getTrip`, `getAvailableSeats`, `createBooking`, `getMyBookings`, `getBooking`, and `cancelBooking`.
2. THE ApiClient SHALL attach `Authorization: Bearer {token}` headers on all requests when a token is present in the AuthStore.
3. THE ApiClient SHALL prefix all request paths with the value of `NEXT_PUBLIC_API_URL`.
4. WHEN an API response has a non-2xx HTTP status code, THE ApiClient SHALL throw a typed `ApiError` containing `status: number`, `message: string`, and optional `errors: Record<string, string[]>`, populated from the response body when parseable as JSON, or from the HTTP status text when the body is not parseable as JSON.
5. WHEN an API response has status 401, THE ApiClient SHALL clear the AuthStore token, then throw an `ApiError` with `status: 401`, and trigger navigation to `/login`.
6. THE ApiClient SHALL set `Content-Type: application/json` on all requests that include a body.
7. IF `NEXT_PUBLIC_API_URL` is not defined at build time, THE ApiClient SHALL throw an error indicating a missing base URL configuration before any request is dispatched.
8. IF a network error occurs before an HTTP response is received, THE ApiClient SHALL throw a typed `ApiError` with `status: 0` and a message indicating a network failure.

---

### Requirement 2: Authentication — Token Storage

**User Story:** As a user, I want my session to persist across page refreshes, so that I do not have to log in again every time I return to the application.

#### Acceptance Criteria

1. WHEN a successful login or registration response is received, THE AuthStore SHALL store the bearer token in `localStorage` under a consistent key, overwriting any previously stored token value for that key.
2. WHEN the App initializes, THE AuthStore SHALL read the token from `localStorage` and load it into memory before any API requests are made.
3. IF no token is found in `localStorage` during App initialization, THEN THE AuthStore SHALL set its in-memory token to null and treat the user as unauthenticated.
4. WHEN the user logs out, THE AuthStore SHALL remove the token from both memory and `localStorage`, such that subsequent reads of that `localStorage` key return no value.
5. WHILE a token is present in the AuthStore, THE ApiClient SHALL include the token as a Bearer token in the `Authorization` header of every outgoing request.
6. IF `localStorage` is unavailable or throws an error during a read or write operation, THEN THE AuthStore SHALL treat the operation as if no token is present and proceed without storing or loading the token.

---

### Requirement 3: User Registration

**User Story:** As a new user, I want to create an account, so that I can book trips.

#### Acceptance Criteria

1. THE App SHALL expose a `/register` route that renders a registration form with fields: name, email, phone, password, and password confirmation.
2. WHEN the registration form is submitted, THE App SHALL call `POST /register` with `{ name, email, phone, password, password_confirmation }`.
3. WHEN the `/register` route is accessed by an already-authenticated user, THE App SHALL redirect the user to `/`.
4. WHEN the registration API call returns HTTP 422, THE App SHALL display field-level error messages from the `errors` object beneath each corresponding input.
5. WHEN the registration API call succeeds, THE App SHALL store the returned token in the AuthStore and redirect the user to `/`.
6. WHILE the registration form submission is in flight, THE App SHALL disable the submit button and display a loading indicator.
7. IF the password and password confirmation fields do not match, THEN THE App SHALL display a validation error message on the password confirmation field before submitting the form to the API.
8. IF the registration API call fails with a status other than HTTP 422, THEN THE App SHALL display a generic error message and re-enable the submit button.

---

### Requirement 4: User Login

**User Story:** As a returning user, I want to log in with my email and password, so that I can access my bookings and book new trips.

#### Acceptance Criteria

1. THE App SHALL expose a `/login` route that renders a login form with fields: email (type email, max 254 characters) and password (type password, max 128 characters).
2. WHEN the login form is submitted, THE App SHALL call `POST /login` with `{ email, password }`.
3. WHEN the `/login` route is accessed by an already-authenticated user, THE App SHALL redirect the user to `/`.
4. WHEN the login API call returns HTTP 401 or HTTP 422, THE App SHALL display a single inline error message indicating invalid credentials, and the submit button SHALL be re-enabled.
5. IF the login API call fails with a status other than HTTP 401 or HTTP 422 (e.g., network error or 5xx), THEN THE App SHALL display an error message indicating a temporary failure and re-enable the submit button without clearing the email field.
6. WHEN the login API call succeeds, THE App SHALL store the returned token in the AuthStore and redirect the user to the value of the `redirect` query parameter if present, otherwise to `/`.
7. IF the `redirect` query parameter value is not a relative path (i.e., starts with `http://`, `https://`, or `//`), THEN THE App SHALL ignore it and redirect to `/` instead.
8. WHILE the login form submission is in flight, THE App SHALL disable the submit button and display a loading indicator within or adjacent to the submit button.

---

### Requirement 5: User Logout

**User Story:** As a logged-in user, I want to log out, so that my session is terminated securely.

#### Acceptance Criteria

1. WHEN the user triggers the logout action from the NavBar, THE App SHALL call `POST /logout` and clear the AuthStore token regardless of whether the API call succeeds.
2. WHEN the logout action completes, THE App SHALL redirect the user to `/login`.
3. WHILE a logout request is in progress, THE App SHALL disable the logout action trigger in the NavBar to prevent duplicate requests.
4. IF the user is not authenticated, THEN THE App SHALL redirect the user to `/login` without calling `POST /logout`.

---

### Requirement 6: Root Layout and Auth-Aware Navigation

**User Story:** As a user, I want a consistent header on every page that reflects my current authentication state, so that I can navigate the application easily.

#### Acceptance Criteria

1. THE App SHALL render a root layout with a NavBar on every page.
2. WHILE no token is present in the AuthStore, THE NavBar SHALL display links to `/login` and `/register`.
3. WHILE a token is present in the AuthStore, THE NavBar SHALL display a link to `/bookings` and a logout button.
4. WHEN the logout button is clicked, THE App SHALL call `POST /logout`, clear the AuthStore token, and navigate to `/login`.
5. THE NavBar SHALL display the application name as a link to `/`.

---

### Requirement 7: Trip List Page

**User Story:** As a user, I want to browse available trips, so that I can find a journey that suits me.

#### Acceptance Criteria

1. THE App SHALL expose a `/` route that renders a list of all trips fetched from `GET /trips`.
2. WHILE the trips data is loading, THE App SHALL display a loading skeleton in place of the trip list.
3. WHEN the trips fetch fails, THE App SHALL display an error banner with a retry button that re-triggers the `GET /trips` fetch.
4. WHEN the trips list is empty, THE App SHALL display an empty-state message indicating no trips are available.
5. WHILE trips data is available, THE App SHALL render each trip as a card showing: the route as an ordered chain of station names and the trip date.
6. WHEN a trip card is clicked and the trip has a valid ID, THE App SHALL navigate to `/trips/[id]` for the corresponding trip.
7. IF a trip has fewer than two stops, THEN THE App SHALL render the available stop names without arrows between them, displaying the route as a single station name.

---

### Requirement 8: Trip Detail and Seat Booking Page

**User Story:** As a user, I want to select a travel segment on a specific trip and choose an available seat, so that I can make a booking.

#### Acceptance Criteria

1. THE App SHALL expose a `/trips/[id]` route that fetches the trip from `GET /trips/{id}` and displays its full ordered route.
2. THE App SHALL render two `<select>` elements for start station and end station, populated exclusively from the stops belonging to the current trip, in ascending `sequence_order`.
3. THE App SHALL constrain the end-station options to only those stops with a `sequence_order` strictly greater than the selected start station's `sequence_order`.
4. WHEN both a start station and an end station are selected, THE App SHALL fetch the seat map from `GET /trips/{id}/available-seats?start_station_id=&end_station_id=`.
5. WHILE the seat map is loading, THE App SHALL display a loading spinner.
6. IF the seat map fetch fails, THEN THE App SHALL display an error banner with a retry button that re-issues the same `GET /trips/{id}/available-seats` request.
7. THE App SHALL render all seats in a visual grid; available seats SHALL be visually distinct from unavailable seats using both a distinct color and `aria-disabled="true"` on unavailable seats.
8. WHEN an available seat is clicked, THE App SHALL mark it as selected; WHEN the selected seat is clicked again, THE App SHALL deselect it, returning to no seat selected.
9. THE App SHALL render a booking panel showing the selected start station name, end station name, and seat number, with a "Confirm Booking" button that is `disabled` until exactly one seat is selected.
10. WHILE no token is present in the AuthStore, THE App SHALL render the confirm button labeled "Log in to book" and, WHEN that button is clicked, SHALL redirect to `/login?redirect=/trips/[id]` where `[id]` is the current trip's identifier.
11. WHEN the confirm button is clicked by an authenticated user, THE App SHALL call `POST /bookings` with `{ trip_id, seat_id, start_station_id, end_station_id }`.
12. IF `POST /bookings` returns a general error (not 409 or 422), THEN THE App SHALL display an error message indicating the booking failed and keep the selected seat and segment unchanged.
13. WHEN `POST /bookings` returns HTTP 201, THE App SHALL navigate to `/bookings/[booking_id]` where `[booking_id]` is the identifier returned in the response.

---

### Requirement 9: Booking Conflict Handling (409)

**User Story:** As a user, I want to be clearly informed when a seat I selected has just been taken, and to see an updated seat map, so that I can pick another seat without confusion.

#### Acceptance Criteria

1. WHEN `POST /bookings` returns HTTP 409, THE App SHALL display a prominent, non-technical inline banner with a message communicating that the selected seat was just taken by another user and prompting the user to choose a different seat.
2. WHEN `POST /bookings` returns HTTP 409, THE App SHALL auto-dismiss the conflict banner after 8 seconds or upon the user explicitly closing it.
3. WHEN `POST /bookings` returns HTTP 409, THE App SHALL invalidate the available-seats query via the QueryClient so the seat map refetches from the API within 3 seconds of receiving the 409 response.
4. WHEN `POST /bookings` returns HTTP 409, THE App SHALL clear the locally selected seat so no seat appears selected after the map refreshes.
5. WHEN `POST /bookings` returns HTTP 409, THE App SHALL keep the user on the `/trips/[id]` page with the refreshed seat map; THE App SHALL NOT navigate away.
6. IF the available-seats refetch triggered by a 409 response itself fails, THEN THE App SHALL display an error banner with a retry button for the seats fetch, allowing the user to manually reload the seat map.

---

### Requirement 10: Successful Booking

**User Story:** As a user, I want to be redirected to my booking confirmation page after a successful booking, so that I can review what I booked.

#### Acceptance Criteria

1. WHEN `POST /bookings` returns HTTP 201, THE App SHALL redirect the user to `/bookings/{newBooking.id}` where `{newBooking.id}` is the `id` field from the API response body.
2. WHEN the user arrives at `/bookings/{id}` immediately following a successful booking submission, THE App SHALL display a success Toast notification that auto-dismisses after 5 seconds.
3. IF the user navigates directly to `/bookings/{id}` without having just completed a booking, THE App SHALL NOT display the success Toast notification.

---

### Requirement 11: Booking Validation Error (422)

**User Story:** As a user, I want to see a clear explanation when my booking submission is invalid, so that I can correct the issue.

#### Acceptance Criteria

1. WHEN `POST /bookings` returns HTTP 422, THE App SHALL display the backend's error message inline near the station selectors within 300ms of receiving the response.
2. WHEN `POST /bookings` returns HTTP 422, THE App SHALL NOT navigate away from `/trips/[id]`.
3. WHILE the HTTP 422 error message is displayed, THE App SHALL preserve all previously entered field values in the booking form.
4. IF `POST /bookings` returns HTTP 422 and the response body does not contain a parseable error message, THEN THE App SHALL display a fallback error message indicating that the submission was invalid and prompting the user to review the station selections.

---

### Requirement 12: My Bookings List

**User Story:** As a logged-in user, I want to see all my bookings in one place, so that I can review and manage my trips.

#### Acceptance Criteria

1. WHEN the `/bookings` route is accessed with a valid token, THE App SHALL fetch the user's bookings from `GET /bookings` and render the list.
2. WHEN the `/bookings` route is accessed without a valid token, THE App SHALL redirect to `/login`.
3. WHILE the bookings data is loading, THE App SHALL display a loading spinner.
4. WHEN the bookings list is empty, THE App SHALL display an empty-state message: "You haven't booked any trips yet" with a link to `/`.
5. WHILE bookings data is available, THE App SHALL render each booking showing: trip code, trip date, start station name, end station name, and seat number.
6. THE App SHALL render a "Cancel" button for each booking whose trip date is in the future.
7. WHEN the cancel button is clicked, THE App SHALL call `DELETE /bookings/{id}` and, upon success, invalidate the bookings query so the list refreshes.
8. WHEN the `GET /bookings` fetch fails, THE App SHALL display an error banner with a retry button that re-triggers the fetch.
9. WHEN `DELETE /bookings/{id}` fails, THE App SHALL display an error message informing the user that cancellation failed, and the booking SHALL remain in the list.

---

### Requirement 13: Booking Detail / Confirmation Page

**User Story:** As a user, I want to view the full details of a single booking, so that I have a record of my reservation.

#### Acceptance Criteria

1. THE App SHALL expose a `/bookings/[id]` route that fetches the booking from `GET /bookings/{id}`.
2. WHEN the `/bookings/[id]` route is accessed without a valid token, THE App SHALL redirect to `/login`.
3. THE App SHALL display: trip code, trip date, start station name, end station name, seat number, and the booking creation timestamp formatted in a human-readable date and time.
4. THE App SHALL render a cancel action on this page that calls `DELETE /bookings/{id}` and, upon success, navigates to `/bookings`.
5. IF `DELETE /bookings/{id}` fails on this page, THEN THE App SHALL display an error message and remain on the `/bookings/[id]` page.
6. IF `GET /bookings/{id}` returns HTTP 404, THEN THE App SHALL display a not-found message and render a link back to `/bookings`.

---

### Requirement 14: Protected Route Enforcement

**User Story:** As a developer, I want protected routes to consistently enforce authentication, so that unauthenticated users cannot access private data.

#### Acceptance Criteria

1. THE App SHALL treat `/bookings` and `/bookings/[id]` as protected routes requiring a valid token in the AuthStore.
2. WHEN an unauthenticated user navigates to a protected route, THE App SHALL redirect to `/login?redirect={original-path}` where `{original-path}` is the requested protected URL.
3. WHEN an API call from a protected route returns HTTP 401, THE ApiClient SHALL clear the AuthStore token and redirect the user to `/login`.
4. WHEN a previously authenticated user's token expires and they access a protected route, THE App SHALL redirect to `/login` after the 401 response clears the AuthStore.

---

### Requirement 15: Shared UI Components

**User Story:** As a developer, I want reusable UI primitives, so that loading, error, and empty states are consistent across all pages and do not need to be reimplemented per page.

#### Acceptance Criteria

1. THE App SHALL provide a `LoadingSpinner` component used whenever asynchronous data is being fetched.
2. THE App SHALL provide an `ErrorBanner` component that accepts a non-empty message string and an optional retry callback; WHEN the retry callback is provided, THE ErrorBanner SHALL render a button that invokes the callback when clicked.
3. THE App SHALL provide an `EmptyState` component that accepts a message and optional child elements, used whenever a list has no items.
4. THE App SHALL provide a `Toast` component capable of displaying transient success and error notifications; WHEN invoked, THE Toast SHALL auto-dismiss after a configurable timeout (default 5 seconds) and SHALL be dismissible by the user before the timeout elapses.

---

### Requirement 16: Accessibility

**User Story:** As a user with assistive technology, I want the application to be navigable and understandable, so that I can use it without relying solely on visual cues.

#### Acceptance Criteria

1. THE App SHALL label all form inputs with associated `<label>` elements linked to their input via matching `for` and `id` attributes, and SHALL associate any visible validation error message with its input using `aria-describedby`.
2. THE App SHALL render the SeatMap container with an `aria-label` identifying it as the seat selection area, and SHALL render each seat within it as a `<button>` with `aria-pressed="true"` when the seat is selected and `aria-pressed="false"` when it is not, and `aria-disabled="true"` when the seat is unavailable and `aria-disabled="false"` when it is available.
3. THE App SHALL ensure focus states are visible on all interactive elements such that the focus indicator has a contrast ratio of at least 3:1 against the adjacent background color.
4. THE App SHALL NOT convey seat availability using color alone; unavailable seats SHALL carry `aria-disabled="true"` in addition to visual styling.
5. THE App SHALL ensure all interactive elements — including form inputs, buttons, and SeatMap seats — are reachable and operable using keyboard navigation alone, in a logical tab order that matches the visual layout.

---

### Requirement 17: Automated Tests

**User Story:** As a developer, I want an automated test suite covering critical flows, so that regressions are caught early.

#### Acceptance Criteria

1. THE App SHALL include tests verifying that the SeatMap renders available seats with `aria-disabled="false"` and unavailable seats with `aria-disabled="true"`.
2. THE App SHALL include a test verifying the successful end-to-end booking flow: select segment → select seat → confirm → the current URL path contains the new booking's ID.
3. THE App SHALL include tests verifying that a loading indicator with `role="status"` or equivalent accessible markup is rendered while asynchronous fetches are in progress.
4. THE App SHALL include tests verifying that `ErrorBanner` renders a button with an accessible label indicating retry when an API fetch fails.
5. THE App SHALL include a test verifying the booking conflict flow: mock `POST /bookings` returning 409, assert the conflict banner appears, the seat map re-renders with refreshed availability data, and the previously selected seat no longer has its selected accessible state.
6. THE App SHALL include tests verifying that login and registration forms render an error message adjacent to each invalid field when a mocked HTTP 422 response is returned.
