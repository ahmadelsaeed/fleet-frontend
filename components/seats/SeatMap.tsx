import type { SeatData } from '@/lib/api/types';
import Seat from './Seat';

type SeatMapProps = {
  seats: SeatData[];
  selectedSeatId: number | null;
  onSelect: (id: number) => void;
};

export default function SeatMap({
  seats,
  selectedSeatId,
  onSelect,
}: SeatMapProps) {
  const sortedSeats = [...seats].sort(
    (a, b) => a.seat_number - b.seat_number,
  );

  const handleClick = (seat: SeatData) => {
    if (!seat.is_available) return;
    if (selectedSeatId === seat.seat_id) {
      onSelect(-1 as unknown as number);
      return;
    }
    onSelect(seat.seat_id);
  };

  return (
    <div aria-label="Seat selection" className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded border border-zinc-300 bg-white" />
          Available
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded border border-blue-700 bg-blue-600" />
          Selected
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded border border-zinc-200 bg-zinc-100" />
          Booked
        </div>
      </div>

      <div
        role="group"
        aria-label="Seats grid"
        className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3"
      >
        {sortedSeats.map((seat) => (
          <Seat
            key={seat.seat_id}
            seat={seat}
            isSelected={selectedSeatId === seat.seat_id}
            onClick={() => handleClick(seat)}
          />
        ))}
      </div>
    </div>
  );
}
