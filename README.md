# Fleet Frontend

A Next.js + TypeScript frontend for booking and managing bus trips. The app is intentionally a separate client from the backend API: it reads configuration from `NEXT_PUBLIC_API_URL`, performs all HTTP traffic through typed API modules, and keeps authentication state in a lightweight memory + `localStorage` store.

## Overview

This repository contains the frontend for a bus-booking workflow:

- register and log in
- browse available trips
- choose a trip segment and seat
- confirm a booking
- view and cancel personal bookings
- handle seat conflicts and validation errors cleanly

It is designed to work with a Laravel/HTTP backend exposing JSON endpoints under a single base URL.

## Environment requirements

Recommended setup:

- Node.js 20 LTS
- npm 10+ or pnpm 9+
- A running backend API that exposes the booking endpoints used by this app
- A modern browser with JavaScript enabled

Important: the frontend does not bundle its own backend. The backend must already be running and reachable before the UI can load trip data or process bookings.

## Installation

From the project root:

```bash
npm install
# or
pnpm install
```

If you are using pnpm and it is not available globally, enable it via Corepack when supported in your environment:

```bash
corepack enable
pnpm install
```

## Configuration

Create a `.env.local` file in the project root with the backend base URL.

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

The value should point to the backend API root, not the frontend app itself. The client prepends this base URL to all requests such as `/trips` and `/bookings`.

If the app is deployed elsewhere, set the same variable to the live API origin.

## How to run the application

Start the development server:

```bash
npm run dev
# or
pnpm dev
```

Then open:

```text
http://localhost:3000
```

The app uses Next.js App Router, so page routing and client-side loading happen automatically.

## Production build

To build for production:

```bash
npm run build
# or
pnpm build
```

Then start the production server:

```bash
npm run start
# or
pnpm start
```

This is useful for verifying the production bundle before deployment.

## How to run automated tests

The project includes Vitest test coverage for the frontend behavior.

Run the suite:

```bash
npm test -- --run
# or
pnpm test -- --run
```

Notes:

- Use a supported Node LTS version; Node 22 can trigger ESM/config issues in this stack depending on local tooling.
- If you see startup errors related to ESM loading or package-manager mismatch, switch to Node 20 LTS and retry.
- The tests are intended to exercise the booking workflow, route logic, and seat conflict behavior.

## How to test or use the APIs

This frontend requires the backend API to be running. The API client is centralized in `lib/api/*` and follows the JSON contract used by the app.

Main API modules:

- `lib/api/auth.ts` — register, login, logout, current user
- `lib/api/trips.ts` — list trips, fetch one trip, fetch available seats
- `lib/api/bookings.ts` — create, list, fetch, cancel bookings
- `lib/api/client.ts` — shared fetch logic and normalized `ApiError` handling

### Base URL behavior

All requests are built using `NEXT_PUBLIC_API_URL` + path. For example:

```ts
const response = await fetch(`${baseUrl}/trips`)
```

In the app, `apiFetch` automatically:

- prefixes the path with `NEXT_PUBLIC_API_URL`
- attaches `Authorization: Bearer <token>` when a token is present
- serializes JSON request bodies
- throws a typed `ApiError` for non-2xx responses

### Typical backend endpoints used by the frontend

- `POST /register`
- `POST /login`
- `POST /logout`
- `GET /me`
- `GET /trips`
- `GET /trips/{id}`
- `GET /trips/{id}/available-seats?start_station_id=...&end_station_id=...`
- `POST /bookings`
- `GET /bookings`
- `GET /bookings/{id}`
- `DELETE /bookings/{id}`

### Example API usage with curl

Login:

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'
```

List trips:

```bash
curl http://localhost:8000/api/trips
```

List personal bookings with auth:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/bookings
```

Create a booking:

```bash
curl -X POST http://localhost:8000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "trip_id": 1,
    "seat_id": 12,
    "start_station_id": 2,
    "end_station_id": 5
  }'
```

For local development, use the same API host and token values the frontend expects.

## How the frontend connects to the backend API

The frontend uses a single configuration entry point:

- `NEXT_PUBLIC_API_URL` in `.env.local`
- `lib/api/client.ts` as the centralized fetch layer
- `lib/auth.ts` for token persistence and retrieval

Authentication flow:

1. User logs in or registers.
2. The backend returns an auth token and user payload.
3. `setToken()` stores the token in memory and `localStorage`.
4. Each subsequent API call goes through `apiFetch()`.
5. `Authorization: Bearer <token>` is attached automatically when a token exists.
6. If the backend responds with `401`, the client clears the token and redirects to `/login`.

This keeps auth logic centralized instead of scattering `fetch` calls across the app.

## Important frontend architectural decisions

### App Router structure

The app is organized by route and feature:

- `app/` — route-level pages
- `components/` — reusable UI building blocks
- `lib/` — shared logic and API modules

Examples:

- `app/` for `/`, `/login`, `/register`, `/trips/[id]`, `/bookings`
- `components/trips/` for trip cards, route breadcrumb, station selectors
- `components/seats/` for seat map and seat buttons
- `components/booking/` for booking summaries and conflict banners

### TanStack Query for server state

The app uses `@tanstack/react-query` to manage data fetching and cache invalidation for trips, seat availability, and bookings.

This is particularly important for seat conflict handling:

- when a booking request gets a `409 Conflict`, the UI shows a clear banner
- it invalidates the relevant seat query
- it clears the stale selected seat
- it keeps the user on the trip page and refreshes the seat list

### Memory + localStorage auth store

Authentication is intentionally not tied to component state alone. The frontend keeps a lightweight singleton token store (`lib/auth.ts`) and rehydrates it after mount. This makes the API client available outside the React tree while preserving session persistence across refreshes.

### Centralized API error handling

The client normalizes backend errors into `ApiError` with:

- `status`
- `message`
- optional `errors` object for validation details

This makes it straightforward to show field-level validation messages, redirect on auth errors, or handle booking conflicts consistently.

## Frontend route map

- `/` — browse trips
- `/login` — authenticate an existing user
- `/register` — create a new account
- `/trips/[id]` — view trip details and seat selection
- `/bookings` — list current user bookings
- `/bookings/[id]` — booking detail / confirmation page

## Notes on development workflow

- Keep HTTP calls inside `lib/api/*`; do not call `fetch` directly in page components.
- Favor React state for local UI state (selected seats, form input values, dropdown selection) and Query for server state.
- Prefer invalidating queries after a booking conflict instead of optimistically marking seats as booked.
- Use the backend as the source of truth for validation and seat availability.

## Troubleshooting

If the app does not load data:

- confirm the backend is running
- confirm `.env.local` points to the correct backend base URL
- ensure the backend accepts CORS requests from the frontend origin
- verify the token is being sent on authenticated requests

If tests fail during startup:

- use Node 20 LTS
- reinstall dependencies after switching Node versions
- re-run `npm install` or `pnpm install`

## Summary

This frontend is a client-focused seat-booking app built on Next.js, TypeScript, and TanStack Query. It communicates with the backend through a single typed API layer, stores auth in memory plus `localStorage`, and provides a user flow for browsing trips, choosing a route segment, reserving a seat, and managing bookings.
