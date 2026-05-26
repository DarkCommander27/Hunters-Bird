import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { TrashIcon, PencilIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { db } from '../db/database';
import { getCachedINaturalistTaxonEntry, getINaturalistPhotoUrl } from '../lib/inaturalist';
import { formatDate, formatTime } from '../lib/utils';
import type { Sighting, PhotoAsset } from '../types';
import { useNavigate } from 'react-router-dom';

type FilterStatus = 'all' | 'confirmed' | 'unknown' | 'pending';

const HABITATS = ['Forest', 'Wetland', 'Grassland', 'Mountain', 'Urban/Suburban', 'River/Stream', 'Lake/Pond'];
const WEATHER_OPTIONS = ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Windy', 'Foggy'];

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

  const pendingSightings = useMemo(
    () => sightings?.filter((sighting) => sighting.status === 'pending') ?? [],
    [sightings],
  );
  const nextPending = pendingSightings[0];

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
        key={`${selected.id}:${selected.status}:${selected.speciesId ?? ''}:${selected.notes}:${selected.weather ?? ''}:${selected.birdCount}:${selected.habitatsSnapshot.join('|')}`}
        sighting={selected}
        onBack={() => setSelected(null)}
        onDelete={() => deleteSighting(selected.id)}
        onReidentify={() => navigate('/add-sighting')}
        onUpdate={(updated) => setSelected(updated)}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-forest-100">My Sightings</h1>

      {pendingSightings.length > 0 && (
        <section className="rounded-2xl border border-bark-800 bg-bark-950/70 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-bark-400">Review Queue</p>
              <h2 className="text-lg font-semibold text-bark-100">{pendingSightings.length} sighting{pendingSightings.length === 1 ? '' : 's'} waiting for review</h2>
              <p className="text-sm text-bark-300 mt-1">
                Pending sightings stay visible until you confirm the ID or send them back to unknown.
              </p>
            </div>
            <StatusBadge status="pending" />
          </div>

          {nextPending && (
            <button
              onClick={() => setSelected(nextPending)}
              className="w-full text-left rounded-xl border border-bark-800 bg-bark-900/40 p-3 transition-colors hover:bg-bark-900/70"
            >
              <p className="font-medium text-bark-100">Next up: {nextPending.speciesNameSnapshot ?? 'Unknown bird'}</p>
              <p className="text-xs text-bark-300 mt-1">{formatDate(nextPending.createdAt)} · {formatTime(nextPending.createdAt)}</p>
              {nextPending.notes && <p className="text-xs text-bark-400 truncate mt-1">{nextPending.notes}</p>}
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('pending')}
              className="px-3 py-2 rounded-xl bg-bark-800 text-bark-100 text-sm font-medium transition-colors hover:bg-bark-700"
            >
              Show pending only
            </button>
            {nextPending && (
              <button
                onClick={() => setSelected(nextPending)}
                className="px-3 py-2 rounded-xl border border-bark-700 text-bark-200 text-sm font-medium transition-colors hover:text-bark-100"
              >
                Review next
              </button>
            )}
          </div>
        </section>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'confirmed', 'pending', 'unknown'] as FilterStatus[]).map(f => (
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
  sighting, onBack, onDelete, onReidentify, onUpdate,
}: {
  sighting: Sighting;
  onBack: () => void;
  onDelete: () => void;
  onReidentify: () => void;
  onUpdate: (updated: Sighting) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftStatus, setDraftStatus] = useState<Sighting['status']>(sighting.status);
  const [draftSpeciesId, setDraftSpeciesId] = useState(sighting.speciesId ?? '');
  const [draftBirdCount, setDraftBirdCount] = useState(sighting.birdCount);
  const [draftWeather, setDraftWeather] = useState(sighting.weather ?? '');
  const [draftNotes, setDraftNotes] = useState(sighting.notes);
  const [draftHabitats, setDraftHabitats] = useState<string[]>(sighting.habitatsSnapshot);
  const [saving, setSaving] = useState(false);
  const photo = useLiveQuery<PhotoAsset | undefined>(
    () => sighting.photoId ? db.photos.get(sighting.photoId) : Promise.resolve(undefined),
    [sighting.photoId],
  );
  const allSpecies = useLiveQuery(
    () => sighting.regionPackId
      ? db.birdSpecies.where('regions').equals(sighting.regionPackId).sortBy('commonName')
      : db.birdSpecies.orderBy('commonName').toArray(),
    [sighting.regionPackId],
  );
  const thumbUrl = photo ? URL.createObjectURL(photo.blob) : null;
  const selectedSpecies = allSpecies?.find((species) => species.id === draftSpeciesId);
  const [taxonPhotoUrl, setTaxonPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let objectUrl: string | null = null;

    async function loadTaxonPhoto() {
      if (!sighting.identificationTaxon?.taxonId) {
        setTaxonPhotoUrl(null);
        return;
      }

      const entry = await getCachedINaturalistTaxonEntry(sighting.identificationTaxon.taxonId);
      if (disposed) return;

      objectUrl = getINaturalistPhotoUrl(sighting.identificationTaxon, entry);
      setTaxonPhotoUrl(objectUrl);
    }

    void loadTaxonPhoto();

    return () => {
      disposed = true;
      if (objectUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    sighting.identificationTaxon?.taxonId,
    sighting.identificationTaxon?.photoMediumUrl,
    sighting.identificationTaxon?.photoSquareUrl,
  ]);

  function toggleHabitat(habitat: string) {
    setDraftHabitats((current) => (
      current.includes(habitat)
        ? current.filter((entry) => entry !== habitat)
        : [...current, habitat]
    ));
  }

  function resetDraft() {
    setDraftStatus(sighting.status);
    setDraftSpeciesId(sighting.speciesId ?? '');
    setDraftBirdCount(sighting.birdCount);
    setDraftWeather(sighting.weather ?? '');
    setDraftNotes(sighting.notes);
    setDraftHabitats(sighting.habitatsSnapshot);
  }

  async function applyReviewStatus(status: Sighting['status']) {
    const updated: Sighting = {
      ...sighting,
      status,
      confirmedByUser: status === 'confirmed',
      speciesId: status === 'unknown' ? undefined : sighting.speciesId,
      speciesNameSnapshot: status === 'unknown' ? undefined : sighting.speciesNameSnapshot,
      identificationSource: status === 'unknown'
        ? 'unknown'
        : sighting.identificationSource ?? 'manual',
      identificationConfidence: status === 'unknown' ? undefined : sighting.identificationConfidence,
    };

    await db.sightings.put(updated);
    onUpdate(updated);
  }

  async function saveEdits() {
    if ((draftStatus === 'confirmed' || draftStatus === 'pending') && !draftSpeciesId) return;

    setSaving(true);
    try {
      const isKnownStatus = draftStatus === 'confirmed' || draftStatus === 'pending';
      const preservedAiMatch = sighting.identificationSource === 'ai' && draftSpeciesId === sighting.speciesId;
      const updated: Sighting = {
        ...sighting,
        speciesId: isKnownStatus ? (draftSpeciesId || undefined) : undefined,
        speciesNameSnapshot: isKnownStatus ? (selectedSpecies?.commonName ?? sighting.speciesNameSnapshot) : undefined,
        habitatsSnapshot: draftHabitats,
        notes: draftNotes.trim(),
        weather: draftWeather || undefined,
        birdCount: draftBirdCount,
        identificationConfidence: preservedAiMatch && isKnownStatus ? sighting.identificationConfidence : undefined,
        identificationSource: !isKnownStatus
          ? 'unknown'
          : preservedAiMatch
            ? 'ai'
            : 'manual',
        confirmedByUser: draftStatus === 'confirmed',
        status: draftStatus,
      };

      await db.sightings.put(updated);
      onUpdate(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const saveDisabled = saving || ((draftStatus === 'confirmed' || draftStatus === 'pending') && !draftSpeciesId);

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

      {(sighting.identificationRationale?.length || sighting.identificationAlternatives?.length) && (
        <section className="rounded-2xl border border-bark-800 bg-bark-950/70 p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-bark-400">Review Evidence</p>
            <p className="text-sm text-bark-200 mt-1">
              Saved AI reasoning helps you revisit why this match was suggested while you are still offline.
            </p>
          </div>

          {sighting.identificationRationale && sighting.identificationRationale.length > 0 && (
            <ul className="space-y-1 text-xs text-bark-300">
              {sighting.identificationRationale.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          )}

          {sighting.identificationTaxon && (
            <div className="rounded-xl border border-bark-800 bg-bark-900/40 p-3 space-y-1">
              {taxonPhotoUrl && (
                <img
                  src={taxonPhotoUrl}
                  alt={sighting.identificationTaxon.preferredCommonName ?? sighting.identificationTaxon.scientificName}
                  className="mb-3 h-32 w-full rounded-lg object-cover"
                />
              )}
              <p className="text-xs font-semibold uppercase tracking-widest text-bark-400">iNaturalist Taxon</p>
              <p className="text-sm text-bark-100">
                {sighting.identificationTaxon.preferredCommonName ?? sighting.identificationTaxon.scientificName}
              </p>
              <p className="text-xs italic text-bark-300">{sighting.identificationTaxon.scientificName}</p>
              <p className="text-xs text-bark-300">
                {sighting.identificationTaxon.observationsCount.toLocaleString()} public observations
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-bark-300">
                <a
                  href={sighting.identificationTaxon.taxonUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-bark-100"
                >
                  Open on iNaturalist
                </a>
                {sighting.identificationTaxon.wikipediaUrl && (
                  <a
                    href={sighting.identificationTaxon.wikipediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-bark-100"
                  >
                    Wikipedia
                  </a>
                )}
              </div>
            </div>
          )}

          {sighting.identificationAlternatives && sighting.identificationAlternatives.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-bark-400">Alternative matches</p>
              <div className="flex flex-wrap gap-2">
                {sighting.identificationAlternatives.map((candidate) => (
                  <span
                    key={candidate.speciesId}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      candidate.speciesId === sighting.speciesId
                        ? 'border-bark-500 bg-bark-800 text-bark-100'
                        : 'border-bark-800 bg-bark-900/60 text-bark-300'
                    }`}
                  >
                    {candidate.speciesName} · {Math.round(candidate.confidence * 100)}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {!editing && sighting.status === 'pending' && (
        <section className="rounded-2xl border border-bark-800 bg-bark-950/70 p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-bark-400">Review Decision</p>
            <p className="text-sm text-bark-200 mt-1">
              Confirm this identification if it looks right, or send it back to unknown until you have better evidence.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void applyReviewStatus('confirmed')}
              className="px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-600 text-forest-100 text-sm font-medium transition-colors"
            >
              Confirm ID
            </button>
            <button
              onClick={() => void applyReviewStatus('unknown')}
              className="px-4 py-2.5 rounded-xl bg-bark-800 hover:bg-bark-700 text-bark-100 text-sm font-medium transition-colors"
            >
              Mark Unknown
            </button>
          </div>
        </section>
      )}

      {editing && (
        <div className="space-y-5 rounded-2xl border border-forest-800 bg-forest-950/70 p-4">
          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-forest-500">Identification Status</p>
            <div className="flex flex-wrap gap-2">
              {(['confirmed', 'pending', 'unknown'] as Sighting['status'][]).map((status) => (
                <button
                  key={status}
                  onClick={() => setDraftStatus(status)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${
                    draftStatus === status
                      ? 'bg-forest-600 text-forest-100'
                      : 'bg-forest-900 border border-forest-700 text-forest-400 hover:text-forest-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-forest-500">Species</label>
            <select
              value={draftSpeciesId}
              onChange={(e) => setDraftSpeciesId(e.target.value)}
              disabled={draftStatus === 'unknown'}
              className="w-full bg-forest-900 border border-forest-700 rounded-xl px-3 py-2.5 text-sm text-forest-100 focus:outline-none focus:border-forest-500 disabled:opacity-50"
            >
              <option value="">{draftStatus === 'unknown' ? 'Unknown bird' : 'Select species…'}</option>
              {(allSpecies ?? []).map((species) => (
                <option key={species.id} value={species.id}>{species.commonName}</option>
              ))}
            </select>
            {draftStatus !== 'unknown' && !draftSpeciesId && (
              <p className="text-xs text-bark-300">Choose a species before saving a known or pending sighting.</p>
            )}
          </section>

          <section className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-forest-500">Bird Count</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDraftBirdCount((count) => Math.max(1, count - 1))}
                className="h-9 w-9 rounded-full bg-forest-800 border border-forest-700 text-forest-200 text-lg font-bold flex items-center justify-center hover:bg-forest-700 transition-colors"
              >
                −
              </button>
              <span className="text-2xl font-bold text-forest-100 w-10 text-center">{draftBirdCount}</span>
              <button
                onClick={() => setDraftBirdCount((count) => count + 1)}
                className="h-9 w-9 rounded-full bg-forest-800 border border-forest-700 text-forest-200 text-lg font-bold flex items-center justify-center hover:bg-forest-700 transition-colors"
              >
                +
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-forest-500">Weather</label>
            <select
              value={draftWeather}
              onChange={(e) => setDraftWeather(e.target.value)}
              className="w-full bg-forest-900 border border-forest-700 rounded-xl px-3 py-2.5 text-sm text-forest-100 focus:outline-none focus:border-forest-500"
            >
              <option value="">Select weather…</option>
              {WEATHER_OPTIONS.map((weather) => (
                <option key={weather} value={weather}>{weather}</option>
              ))}
            </select>
          </section>

          <section className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-forest-500">Habitats</label>
            <div className="flex flex-wrap gap-2">
              {HABITATS.map((habitat) => (
                <button
                  key={habitat}
                  onClick={() => toggleHabitat(habitat)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    draftHabitats.includes(habitat)
                      ? 'bg-forest-600 text-forest-100'
                      : 'bg-forest-900 border border-forest-700 text-forest-400 hover:text-forest-300'
                  }`}
                >
                  {habitat}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-forest-500">Notes</label>
            <textarea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              rows={4}
              placeholder="Behavior, plumage details, song, location notes…"
              className="w-full bg-forest-900 border border-forest-700 rounded-xl px-3 py-2.5 text-sm text-forest-100 placeholder-forest-500 focus:outline-none focus:border-forest-500 resize-none"
            />
          </section>

          <div className="flex gap-3">
            <button
              onClick={() => {
                resetDraft();
                setEditing(false);
              }}
              className="px-4 py-2.5 bg-forest-900 border border-forest-700 text-forest-300 rounded-xl text-sm font-medium transition-colors hover:text-forest-100"
            >
              Cancel
            </button>
            <button
              onClick={saveEdits}
              disabled={saveDisabled}
              className="px-4 py-2.5 bg-forest-700 hover:bg-forest-600 text-forest-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!editing && sighting.status === 'unknown' && (
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
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-forest-900 border border-forest-700 text-forest-400 hover:text-forest-200 rounded-xl text-sm font-medium transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
            Edit Sighting
          </button>
        )}
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
