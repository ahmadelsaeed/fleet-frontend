import type { TripStop } from '@/lib/api/types';

type StationSelectProps = {
  stops?: TripStop[];
  startStationId: number | null;
  endStationId: number | null;
  onStartChange: (id: number | null) => void;
  onEndChange: (id: number | null) => void;
};

export default function StationSelect({
  stops,
  startStationId,
  endStationId,
  onStartChange,
  onEndChange,
}: StationSelectProps) {
  const safeStops = stops ?? [];
  const sortedStops = [...safeStops].sort(
    (a, b) => a.sequence_order - b.sequence_order,
  );

  const startStop =
    startStationId !== null
      ? sortedStops.find((s) => s.station.id === startStationId)
      : undefined;

  const endOptions = startStop
    ? sortedStops.filter((s) => s.sequence_order > startStop.sequence_order)
    : [];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label
          htmlFor="start-station"
          className="block text-sm font-medium text-zinc-700"
        >
          From
        </label>
        <select
          id="start-station"
          value={startStationId ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            const newStart = value === '' ? null : Number(value);
            onStartChange(newStart);
            if (
              endStationId !== null &&
              startStop !== undefined &&
              newStart !== null
            ) {
              const newStartStop = sortedStops.find(
                (s) => s.station.id === newStart,
              );
              const currEndStop = sortedStops.find(
                (s) => s.station.id === endStationId,
              );
              if (
                newStartStop &&
                currEndStop &&
                currEndStop.sequence_order <= newStartStop.sequence_order
              ) {
                onEndChange(null);
              }
            }
          }}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          <option value="">Select start station…</option>
          {sortedStops.map((stop) => (
            <option key={stop.id} value={stop.station.id}>
              {stop.station.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="end-station"
          className="block text-sm font-medium text-zinc-700"
        >
          To
        </label>
        <select
          id="end-station"
          value={endStationId ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            onEndChange(value === '' ? null : Number(value));
          }}
          disabled={startStationId === null || endOptions.length === 0}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">
            {startStationId === null
              ? 'Select a start station first'
              : 'Select destination…'}
          </option>
          {endOptions.map((stop) => (
            <option key={stop.id} value={stop.station.id}>
              {stop.station.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
