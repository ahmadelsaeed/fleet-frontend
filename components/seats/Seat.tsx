import type { SeatData } from '@/lib/api/types';

type SeatProps = {
  seat: SeatData;
  isSelected: boolean;
  onClick: () => void;
};

export default function Seat({ seat, isSelected, onClick }: SeatProps) {
  const unavailable = !seat.is_available;

  const handleClick = () => {
    if (unavailable) return;
    onClick();
  };

  const base =
    'inline-flex h-11 w-11 items-center justify-center rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 select-none';

  let styles = '';
  if (unavailable) {
    styles =
      'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200';
  } else if (isSelected) {
    styles =
      'bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 focus:ring-blue-500';
  } else {
    styles =
      'bg-white text-zinc-800 border border-zinc-300 hover:bg-blue-50 hover:border-blue-400 cursor-pointer focus:ring-blue-500';
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={!unavailable && isSelected}
      aria-disabled={unavailable}
      disabled={unavailable}
      aria-label={
        unavailable
          ? `Seat ${seat.seat_number} — unavailable`
          : isSelected
            ? `Seat ${seat.seat_number} — selected`
            : `Seat ${seat.seat_number} — available`
      }
      className={`${base} ${styles}`}
    >
      {seat.seat_number}
    </button>
  );
}
