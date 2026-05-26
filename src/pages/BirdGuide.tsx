import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { db } from '../db/database';
import { useSettings } from '../hooks/useSettings';
import type { BirdSpecies } from '../types';

const HABITATS = ['Forest', 'Wetland', 'Grassland', 'Mountain', 'Urban/Suburban', 'River/Stream', 'Lake/Pond'];

export function BirdGuide() {
  const settings = useSettings();
  const [query, setQuery] = useState('');
  const [habitatFilter, setHabitatFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<BirdSpecies | null>(null);

  const allSpecies = useLiveQuery(
    () => settings.activeRegionPackId
      ? db.birdSpecies.where('regions').equals(settings.activeRegionPackId).toArray()
      : db.birdSpecies.toArray(),
    [settings.activeRegionPackId],
  );

  const filtered = useMemo(() => {
    if (!allSpecies) return [];
    let list = allSpecies;
    if (habitatFilter) list = list.filter(s => s.habitats.includes(habitatFilter));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(s =>
        s.commonName.toLowerCase().includes(q) ||
        s.scientificName.toLowerCase().includes(q) ||
        s.aliases.some(a => a.toLowerCase().includes(q)),
      );
    }
    return list.sort((a, b) => a.commonName.localeCompare(b.commonName));
  }, [allSpecies, query, habitatFilter]);

  if (selected) {
    return <SpeciesDetail species={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-forest-100">Bird Guide</h1>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-500" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="w-full bg-forest-900 border border-forest-700 rounded-xl pl-9 pr-4 py-2.5 text-forest-100 placeholder-forest-500 focus:outline-none focus:border-forest-500 text-sm"
        />
      </div>

      {/* Habitat chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Chip label="All" active={!habitatFilter} onClick={() => setHabitatFilter(null)} />
        {HABITATS.map(h => (
          <Chip key={h} label={h} active={habitatFilter === h} onClick={() => setHabitatFilter(h === habitatFilter ? null : h)} />
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-forest-500">
        {filtered.length} species in {settings.activeRegionPackId ?? 'all regions'}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-forest-300 font-semibold">No birds found</p>
          <p className="text-forest-500 text-sm">Try a different search or habitat filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(species => (
            <button
              key={species.id}
              onClick={() => setSelected(species)}
              className="w-full text-left flex items-center gap-3 bg-forest-900 hover:bg-forest-800 border border-forest-800 rounded-xl p-3 transition-colors"
            >
              <span className="text-2xl">🐦</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-forest-100 truncate">{species.commonName}</p>
                <p className="text-xs text-forest-500 italic truncate">{species.scientificName}</p>
              </div>
              <div className="flex flex-wrap gap-1 justify-end shrink-0">
                {species.habitats.slice(0, 2).map(h => (
                  <span key={h} className="text-xs bg-forest-800 text-forest-400 px-1.5 py-0.5 rounded">
                    {h}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
        active
          ? 'bg-forest-600 text-forest-100'
          : 'bg-forest-900 border border-forest-700 text-forest-400 hover:text-forest-300'
      }`}
    >
      {label}
    </button>
  );
}

function SpeciesDetail({ species, onBack }: { species: BirdSpecies; onBack: () => void }) {
  return (
    <div className="p-4 space-y-5">
      <button onClick={onBack} className="text-forest-400 hover:text-forest-200 text-sm flex items-center gap-1">
        ← Back to guide
      </button>

      <div>
        <h1 className="text-2xl font-bold text-forest-100">{species.commonName}</h1>
        <p className="text-forest-400 italic">{species.scientificName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Order" value={species.order} />
        <InfoCard label="Family" value={species.family} />
      </div>

      {species.description && (
        <div className="bg-forest-900 rounded-xl p-4 border border-forest-800">
          <p className="text-sm text-forest-300 leading-relaxed">{species.description}</p>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-500 mb-2">Habitats</p>
        <div className="flex flex-wrap gap-2">
          {species.habitats.map(h => (
            <span key={h} className="text-sm bg-forest-800 text-forest-300 px-3 py-1 rounded-full">{h}</span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-500 mb-2">Seasonality</p>
        <div className="flex flex-wrap gap-2">
          {species.seasonality.map(s => (
            <span key={s} className="text-sm bg-bark-900 text-bark-300 px-3 py-1 rounded-full capitalize">{s}</span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-500 mb-2">States</p>
        <div className="flex flex-wrap gap-1.5">
          {species.states.map(s => (
            <span key={s} className="text-xs bg-forest-800 text-forest-400 px-2 py-0.5 rounded">{s}</span>
          ))}
        </div>
      </div>

      {species.aliases.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-500 mb-2">Also known as</p>
          <p className="text-sm text-forest-400">{species.aliases.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-forest-900 rounded-xl p-3 border border-forest-800">
      <p className="text-xs text-forest-500 uppercase tracking-widest">{label}</p>
      <p className="font-medium text-forest-200 mt-0.5">{value}</p>
    </div>
  );
}
