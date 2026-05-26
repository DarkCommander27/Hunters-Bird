import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { TrashIcon, PencilIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { db } from '../db/database';
import { formatDate, formatTime } from '../lib/utils';
import type { Sighting, PhotoAsset } from '../types';
import { useNavigate } from 'react-router-dom';

type FilterStatus = 'all' | 'confirmed' | 'unknown';

export function Sightings() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selected, setSelected] = useState<Sighting | null>(null);
  const navigate = useNavigate();

  const sightings = useLiveQuery(
    () => db.sightings.orderBy('createdAt').reverse().toArray(),
    [],
  );

  const filtered = useMemo(() => {
    if (!sightings) return [];
    if (statusFilter === 'all') return sightings;
    return sightings.filter(s => s.status === statusFilter);
  }, [sightings, statusFilter]);

  async function deleteSighting(id: string) {
    if (!confirm('Delete this sighting?')) return;
    const s = await db.sightings.get(id);
    if (s?.photoId) await db.photos.delete(s.photoId);
    await db.sightings.delete(id);
    setSelected(null);
  }

  if (selected) {
    return (
      <SightingDetail
        sighting={selected}
        onBack={() => setSelected(null)}
        onDelete={() => deleteSighting(selected.id)}
        onReidentify={() => navigate('/add-sighting')}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-forest-100">My Sightings</h1>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'confirmed', 'unknown'] as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${
              statusFilter === f
                ? 'bg-forest-600 text-forest-100'
                : 'bg-forest-900 border border-forest-700 text-forest-400 hover:text-forest-300'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-forest-500 self-center">{filtered.length} sightings</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-4xl">🔭</span>
          <p className="font-semibold text-forest-300">No sightings yet</p>
          <p className="text-sm text-forest-500">Log your first bird to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <SightingCard key={s.id} sighting={s} onClick={() => setSelected(s)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SightingCard({ sighting, onClick }: { sighting: Sighting; onClick: () => void }) {
  const photo = useLiveQuery<PhotoAsset | undefined>(
    () => sighting.photoId ? db.photos.get(sighting.photoId) : Promise.resolve(undefined),
    [sighting.photoId],
  );

  const thumbUrl = photo ? URL.createObjectURL(photo.blob) : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 bg-forest-900 hover:bg-forest-800 border border-forest-800 rounded-xl p-3 transition-colors"
    >
      {thumbUrl ? (
        <img src={thumbUrl} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="h-14 w-14 rounded-lg bg-forest-800 flex items-center justify-center text-2xl shrink-0">🐦</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-forest-100 truncate">
          {sighting.speciesNameSnapshot ?? 'Unknown bird'}
        </p>
        <p className="text-xs text-forest-500">
          {formatDate(sighting.createdAt)} · {formatTime(sighting.createdAt)}
        </p>
        {sighting.notes && (
          <p className="text-xs text-forest-500 truncate mt-0.5">{sighting.notes}</p>
        )}
      </div>
      <StatusBadge status={sighting.status} />
    </button>
  );
}

function SightingDetail({
  sighting, onBack, onDelete, onReidentify,
}: {
  sighting: Sighting;
  onBack: () => void;
  onDelete: () => void;
  onReidentify: () => void;
}) {
  const photo = useLiveQuery<PhotoAsset | undefined>(
    () => sighting.photoId ? db.photos.get(sighting.photoId) : Promise.resolve(undefined),
    [sighting.photoId],
  );
  const thumbUrl = photo ? URL.createObjectURL(photo.blob) : null;

  return (
    <div className="p-4 space-y-5 pb-8">
      <button onClick={onBack} className="text-forest-400 hover:text-forest-200 text-sm">
        ← Back to sightings
      </button>

      {thumbUrl && (
        <img src={thumbUrl} alt="Sighting photo" className="w-full h-64 object-cover rounded-xl" />
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-forest-100">
            {sighting.speciesNameSnapshot ?? 'Unknown bird'}
          </h1>
          <p className="text-sm text-forest-500">
            {formatDate(sighting.createdAt)} at {formatTime(sighting.createdAt)}
          </p>
        </div>
        <StatusBadge status={sighting.status} />
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Birds Seen" value={String(sighting.birdCount)} />
        {sighting.weather && <InfoCard label="Weather" value={sighting.weather} />}
        {sighting.latitude && sighting.longitude && (
          <InfoCard
            label="GPS"
            value={`${sighting.latitude.toFixed(4)}, ${sighting.longitude.toFixed(4)}`}
          />
        )}
        {sighting.identificationConfidence !== undefined && (
          <InfoCard
            label="Confidence"
            value={`${Math.round(sighting.identificationConfidence * 100)}%`}
          />
        )}
      </div>

      {sighting.habitatsSnapshot.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-500 mb-2">Habitats</p>
          <div className="flex flex-wrap gap-2">
            {sighting.habitatsSnapshot.map(h => (
              <span key={h} className="text-sm bg-forest-800 text-forest-300 px-3 py-1 rounded-full">{h}</span>
            ))}
          </div>
        </div>
      )}

      {sighting.notes && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-500 mb-2">Notes</p>
          <div className="bg-forest-900 rounded-xl p-4 border border-forest-800">
            <p className="text-sm text-forest-300 leading-relaxed">{sighting.notes}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {sighting.status === 'unknown' && (
          <button
            onClick={onReidentify}
            className="flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-600 text-forest-100 rounded-xl text-sm font-medium transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Re-identify
          </button>
        )}
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-900 hover:bg-red-900 border border-forest-700 text-forest-400 hover:text-red-300 rounded-xl text-sm font-medium transition-colors"
        >
          <TrashIcon className="h-4 w-4" />
          Delete
        </button>
        <button
          onClick={onBack}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-forest-900 border border-forest-700 text-forest-400 hover:text-forest-200 rounded-xl text-sm font-medium transition-colors"
        >
          <PencilIcon className="h-4 w-4" />
          Edit (soon)
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'bg-forest-700 text-forest-300',
    unknown:   'bg-bark-800 text-bark-300',
    pending:   'bg-forest-800 text-forest-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-forest-900 rounded-xl p-3 border border-forest-800">
      <p className="text-xs text-forest-500 uppercase tracking-widest">{label}</p>
      <p className="font-medium text-forest-200 mt-0.5 truncate">{value}</p>
    </div>
  );
}
