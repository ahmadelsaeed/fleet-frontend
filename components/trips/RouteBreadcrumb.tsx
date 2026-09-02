import type { TripStop } from '@/lib/api/types';

type RouteBreadcrumbProps = {
  stops?: TripStop[];
};

export default function RouteBreadcrumb({ stops }: RouteBreadcrumbProps) {
  const safeStops = stops ?? [];

  if (safeStops.length === 0) return null;

  const sorted = [...safeStops].sort(
    (a, b) => a.sequence_order - b.sequence_order,
  );

  if (sorted.length < 2) {
    return (
      <span className="text-sm font-medium text-zinc-800">
        {sorted[0]!.station.name}
      </span>
    );
  }

  return (
    <ol className="flex flex-wrap items-center gap-1 text-sm font-medium text-zinc-800">
      {sorted.map((stop, idx) => (
        <li key={stop.id} className="flex items-center gap-1">
          <span>{stop.station.name}</span>
          {idx < sorted.length - 1 && (
            <span aria-hidden="true" className="text-zinc-400 mx-0.5">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
