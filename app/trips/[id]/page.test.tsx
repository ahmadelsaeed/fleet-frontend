import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TripDetailPage from './page';
import { ApiError } from '@/lib/api/types';

const pushMock = vi.fn();
const invalidateQueriesMock = vi.fn();
const getTripMock = vi.fn();
const getAvailableSeatsMock = vi.fn();
const createBookingMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/api/trips', () => ({
  getTrip: (...args: unknown[]) => getTripMock(...args),
  getAvailableSeats: (...args: unknown[]) => getAvailableSeatsMock(...args),
}));

vi.mock('@/lib/api/bookings', () => ({
  createBooking: (...args: unknown[]) => createBookingMock(...args),
}));

vi.mock('@/lib/providers', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: invalidateQueriesMock,
    }),
  };
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TripDetailPage />
    </QueryClientProvider>,
  );
}

const tripFixture = {
  id: 1,
  code: 'TR-100',
  date: '2026-09-03',
  bus: { id: 1, name: 'Fleet Bus' },
  stops: [
    { id: 11, sequence_order: 1, station: { id: 101, name: 'Cairo' } },
    { id: 12, sequence_order: 2, station: { id: 102, name: 'Giza' } },
    { id: 13, sequence_order: 3, station: { id: 103, name: 'Alex' } },
  ],
};

describe('Trip detail booking page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ isAuthenticated: true, isReady: true });
    getTripMock.mockResolvedValue(tripFixture);
    getAvailableSeatsMock.mockResolvedValue({
      trip_id: 1,
      start_station_id: 101,
      end_station_id: 102,
      seats: [
        { seat_id: 1, seat_number: 1, is_available: true },
        { seat_id: 2, seat_number: 2, is_available: false },
      ],
    });
    createBookingMock.mockResolvedValue({ id: 777 });
  });

  async function selectStations({ waitForSeats = true } = {}) {
    const fromSelect = await screen.findByLabelText('From');
    const toSelect = await screen.findByLabelText('To');

    fireEvent.change(fromSelect, { target: { value: '101' } });
    fireEvent.change(toSelect, { target: { value: '102' } });

    if (waitForSeats) {
      await screen.findByRole('group', { name: 'Seats grid' });
    }
  }

  it('renders available and unavailable seats', async () => {
    renderPage();
    await selectStations();

    expect(
      screen.getByRole('button', { name: 'Seat 1 — available' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Seat 2 — unavailable' }),
    ).toBeDisabled();
  });

  it('completes successful booking flow', async () => {
    renderPage();
    await selectStations();

    fireEvent.click(screen.getByRole('button', { name: 'Seat 1 — available' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Booking' }));

    await waitFor(() => {
      expect(createBookingMock).toHaveBeenCalledWith({
        trip_id: 1,
        seat_id: 1,
        start_station_id: 101,
        end_station_id: 102,
      });
      expect(pushMock).toHaveBeenCalledWith('/bookings/777?success=1');
    });
  });

  it('shows loading and API error states', async () => {
    getAvailableSeatsMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          window.setTimeout(() => reject(new Error('Failed to load seats.')), 0);
        }),
    );

    renderPage();
    await selectStations({ waitForSeats: false });
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(await screen.findByText('Failed to load seats.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry failed action' })).toBeInTheDocument();
  });

  it('handles booking conflict when seat becomes unavailable before submit', async () => {
    createBookingMock.mockRejectedValue(
      new ApiError(409, 'Seat already booked by another user.'),
    );

    renderPage();
    await selectStations();

    fireEvent.click(screen.getByRole('button', { name: 'Seat 1 — available' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Booking' }));

    expect(
      await screen.findByText('Seat no longer available'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Confirm Booking' }),
      ).toBeDisabled();
      expect(invalidateQueriesMock).toHaveBeenCalled();
    });
  });
});
