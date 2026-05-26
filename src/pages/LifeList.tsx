import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { formatDate } from '../lib/utils';

export function LifeList() {
  const sightings = useLiveQuery(
    () => db.sightings.where('status').equals('confirmed').toArray(),
    [],
  );

  // Unique confirmed species
  const species = useMemo(() => {
    if (!sightings) return [];
    const seen = new Map<string, { name: string; firstSeen: number; count: number }>();
    for (const s of sightings) {
      const key = s.speciesId ?? s.speciesNameSnapshot ?? 'unknown';
      const name = s.speciesNameSnapshot ?? 'Unknown';
      const existing = seen.get(key);
      if (existing) {
        existing.count++;
        if (s.createdAt < existing.firstSeen) existing.firstSeen = s.createdAt;
      } else {
        seen.set(key, { name, firstSeen: s.createdAt, count: 1 });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [sightings]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-forest-100">Life List</h1>
        <span className="text-3xl font-bold text-forest-400">{species.length}</span>
      </div>
      <p className="text-sm text-forest-400">
        Unique confirmed species across all your sightings.
      </p>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Species" value={String(species.length)} />
        <StatCard label="Sightings" value={String(sightings?.length ?? 0)} />
        <StatCard
          label="Unknown"
          value={String((sightings?.filter(s => s.status === 'unknown').length) ?? 0)}
        />
      </div>

      {species.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-4xl">🌿</span>
          <p className="font-semibold text-forest-300">Your life list is empty</p>
          <p className="text-sm text-forest-500">
            Confirm species identifications in your sightings to build your life list.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {species.map((sp, i) => (
            <div
              key={sp.name + i}
              className="flex items-center gap-3 bg-forest-900 border border-forest-800 rounded-xl p-3"
            >
              <span className="text-xl font-bold text-forest-600 w-8 text-center shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-forest-100 truncate">{sp.name}</p>
                <p className="text-xs text-forest-500">
                  First seen {formatDate(sp.firstSeen)} · {sp.count} {sp.count === 1 ? 'sighting' : 'sightings'}
                </p>
              </div>
              <span className="text-2xl">🐦</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-forest-900 border border-forest-800 p-4 text-sm text-forest-400 space-y-1">
        <p className="font-medium text-forest-300">Coming soon</p>
        <p>Export life list as CSV, share achievements, and track species by region or season.</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-forest-900 rounded-xl p-3 border border-forest-800 text-center">
      <p className="text-2xl font-bold text-forest-200">{value}</p>
      <p className="text-xs text-forest-500 uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  );
}
