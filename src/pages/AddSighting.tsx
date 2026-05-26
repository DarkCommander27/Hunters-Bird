import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  CameraIcon,
  PhotoIcon,
  MapPinIcon,
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { db } from '../db/database';
import { useSettings } from '../hooks/useSettings';
import { newId, compressImage } from '../lib/utils';
import { demoBirdIdentifier, type IdentificationSuggestion } from '../lib/identification';
import type { BirdSpecies, Sighting, PhotoAsset } from '../types';

const HABITATS = ['Forest', 'Wetland', 'Grassland', 'Mountain', 'Urban/Suburban', 'River/Stream', 'Lake/Pond'];
const WEATHER_OPTIONS = ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Windy', 'Foggy'];

export function AddSighting() {
  const navigate = useNavigate();
  const settings = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');
  const [birdCount, setBirdCount] = useState(1);
  const [weather, setWeather] = useState('');
  const [selectedHabitats, setSelectedHabitats] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<BirdSpecies | null>(null);
  const [speciesQuery, setSpeciesQuery] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [identifyLoading, setIdentifyLoading] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<IdentificationSuggestion | null>(null);

  const allSpecies = useLiveQuery(
    () => settings.activeRegionPackId
      ? db.birdSpecies.where('regions').equals(settings.activeRegionPackId).sortBy('commonName')
      : db.birdSpecies.orderBy('commonName').toArray(),
    [settings.activeRegionPackId],
  );

  const filteredSpecies = allSpecies?.filter(s => {
    const q = speciesQuery.toLowerCase();
    return !q || s.commonName.toLowerCase().includes(q) || s.scientificName.toLowerCase().includes(q);
  }) ?? [];

  const handleFile = useCallback(async (file: File) => {
    const compressed = await compressImage(file);
    setPhotoBlob(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
  }, []);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function toggleHabitat(h: string) {
    setSelectedHabitats(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h],
    );
  }

  const selectedAiCandidate = selectedSpecies && aiSuggestion
    ? aiSuggestion.species.id === selectedSpecies.id
      ? {
          species: aiSuggestion.species,
          confidence: aiSuggestion.confidence,
          rationale: aiSuggestion.rationale,
        }
      : aiSuggestion.alternatives.find((candidate) => candidate.species.id === selectedSpecies.id)
    : undefined;

  async function captureGps() {
    if (!settings.gpsEnabled) return;
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      err => {
        setGpsError(err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function saveSighting(saveAs: 'confirmed' | 'pending' | 'unknown') {
    setSaving(true);
    try {
      let photoId: string | undefined;
      if (photoBlob) {
        const asset: PhotoAsset = {
          id: newId(),
          blob: photoBlob,
          mimeType: 'image/jpeg',
          createdAt: Date.now(),
        };
        await db.photos.put(asset);
        photoId = asset.id;
      }

      const isKnownSighting = saveAs === 'confirmed' || saveAs === 'pending';
      const usedAiSuggestion = Boolean(selectedAiCandidate);
      const sighting: Sighting = {
        id: newId(),
        speciesId: isKnownSighting ? (selectedSpecies?.id ?? undefined) : undefined,
        speciesNameSnapshot: isKnownSighting ? (selectedSpecies?.commonName ?? undefined) : undefined,
        photoId,
        createdAt: Date.now(),
        latitude: gpsCoords?.lat,
        longitude: gpsCoords?.lng,
        regionPackId: settings.activeRegionPackId,
        habitatsSnapshot: selectedHabitats,
        notes,
        weather: weather || undefined,
        birdCount,
        identificationConfidence: isKnownSighting && usedAiSuggestion ? selectedAiCandidate?.confidence : undefined,
        identificationSource: saveAs === 'unknown' ? 'unknown' : (usedAiSuggestion ? 'ai' : 'manual'),
        identificationRationale: isKnownSighting && usedAiSuggestion ? selectedAiCandidate?.rationale : undefined,
        identificationAlternatives: isKnownSighting && aiSuggestion
          ? [
              {
                speciesId: aiSuggestion.species.id,
                speciesName: aiSuggestion.species.commonName,
                confidence: aiSuggestion.confidence,
                rationale: aiSuggestion.rationale,
              },
              ...aiSuggestion.alternatives.map((candidate) => ({
                speciesId: candidate.species.id,
                speciesName: candidate.species.commonName,
                confidence: candidate.confidence,
                rationale: candidate.rationale,
              })),
            ].filter((candidate, index, allCandidates) => {
              return allCandidates.findIndex((entry) => entry.speciesId === candidate.speciesId) === index;
            })
          : undefined,
        confirmedByUser: saveAs === 'confirmed',
        status: saveAs,
      };

      await db.sightings.put(sighting);
      navigate('/sightings');
    } finally {
      setSaving(false);
    }
  }

  async function identifySpecies() {
    if (!photoBlob && !notes.trim() && selectedHabitats.length === 0) {
      setIdentifyError('Add a photo, notes, or habitat details first.');
      return;
    }

    setIdentifyLoading(true);
    setIdentifyError(null);
    try {
      const suggestion = await demoBirdIdentifier.identify({
        photoName: photoBlob instanceof File ? photoBlob.name : undefined,
        notes,
        habitats: selectedHabitats,
        regionPackId: settings.activeRegionPackId,
        species: allSpecies ?? [],
      });

      if (!suggestion) {
        setAiSuggestion(null);
        setIdentifyError('No strong match yet. Add more notes, habitat clues, or a clearer photo.');
        return;
      }

      setSelectedSpecies(suggestion.species);
      setAiSuggestion(suggestion);
      setNotes((current) => {
        if (!current.trim()) return suggestion.autoNotes;
        if (current.includes(suggestion.species.commonName)) return current;
        return `${current.trim()}\n\nSuggested ID:\n${suggestion.autoNotes}`;
      });
    } finally {
      setIdentifyLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      <h1 className="text-xl font-bold text-forest-100">Log a Bird</h1>

      {/* Photo section */}
      <section className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-forest-500">Photo</label>
        {photoPreview ? (
          <div className="relative rounded-xl overflow-hidden">
            <img src={photoPreview} alt="Bird sighting" className="w-full h-56 object-cover" />
            <button
              onClick={() => { setPhotoPreview(null); setPhotoBlob(null); }}
              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center gap-2 py-6 bg-forest-900 border border-forest-700 border-dashed rounded-xl text-forest-400 hover:text-forest-200 hover:border-forest-500 transition-colors"
            >
              <CameraIcon className="h-7 w-7" />
              <span className="text-sm font-medium">Take Photo</span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-2 py-6 bg-forest-900 border border-forest-700 border-dashed rounded-xl text-forest-400 hover:text-forest-200 hover:border-forest-500 transition-colors"
            >
              <PhotoIcon className="h-7 w-7" />
              <span className="text-sm font-medium">Choose Photo</span>
            </button>
          </div>
        )}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput} />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
      </section>

      {/* Species picker */}
      <section className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-forest-500">Species</label>
        <button
          onClick={identifySpecies}
          disabled={identifyLoading || (!photoBlob && !notes.trim() && selectedHabitats.length === 0)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bark-900 border border-bark-700 rounded-xl text-sm font-medium text-bark-200 hover:bg-bark-800 transition-colors disabled:opacity-50"
        >
          <SparklesIcon className="h-5 w-5" />
          {identifyLoading ? 'Analyzing bird clues…' : `Identify with ${demoBirdIdentifier.label}`}
        </button>
        <button
          onClick={() => setShowSpeciesPicker(true)}
          className="w-full text-left px-4 py-3 bg-forest-900 border border-forest-700 rounded-xl text-sm transition-colors hover:border-forest-500"
        >
          {selectedSpecies ? (
            <span className="text-forest-100 font-medium">{selectedSpecies.commonName}</span>
          ) : (
            <span className="text-forest-500">Search and select a species…</span>
          )}
        </button>

        {aiSuggestion && (
          <div className="rounded-xl border border-bark-700 bg-bark-950/60 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-bark-400">AI Suggestion</p>
                <p className="text-base font-semibold text-bark-100">{aiSuggestion.species.commonName}</p>
                <p className="text-xs italic text-bark-300">{aiSuggestion.species.scientificName}</p>
              </div>
              <span className="rounded-full bg-bark-800 px-2.5 py-1 text-xs font-semibold text-bark-200">
                {Math.round(aiSuggestion.confidence * 100)}% match
              </span>
            </div>
            <p className="text-sm text-bark-200">{aiSuggestion.species.description}</p>
            <ul className="space-y-1 text-xs text-bark-300">
              {aiSuggestion.rationale.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
            {aiSuggestion.alternatives.length > 0 && (
              <div className="pt-2 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-bark-400">Other likely matches</p>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestion.alternatives.map((candidate) => (
                    <button
                      key={candidate.species.id}
                      onClick={() => {
                        setSelectedSpecies(candidate.species);
                        setIdentifyError(null);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedSpecies?.id === candidate.species.id
                          ? 'border-bark-500 bg-bark-800 text-bark-100'
                          : 'border-bark-800 bg-bark-900/60 text-bark-300 hover:text-bark-100'
                      }`}
                    >
                      {candidate.species.commonName} · {Math.round(candidate.confidence * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {identifyError && <p className="text-xs text-bark-300">{identifyError}</p>}

        {showSpeciesPicker && (
          <div className="bg-forest-900 border border-forest-700 rounded-xl overflow-hidden">
            <div className="p-2 border-b border-forest-800">
              <input
                type="search"
                value={speciesQuery}
                onChange={e => setSpeciesQuery(e.target.value)}
                placeholder="Search species…"
                autoFocus
                className="w-full bg-forest-800 border border-forest-700 rounded-lg px-3 py-2 text-sm text-forest-100 placeholder-forest-500 focus:outline-none focus:border-forest-500"
              />
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-forest-800">
              {filteredSpecies.slice(0, 20).map(sp => (
                <button
                  key={sp.id}
                  onClick={() => { setSelectedSpecies(sp); setShowSpeciesPicker(false); setSpeciesQuery(''); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-forest-800 transition-colors"
                >
                  <p className="text-sm font-medium text-forest-100">{sp.commonName}</p>
                  <p className="text-xs text-forest-500 italic">{sp.scientificName}</p>
                </button>
              ))}
              {filteredSpecies.length === 0 && (
                <p className="text-sm text-forest-500 px-4 py-3">No matches found.</p>
              )}
            </div>
            <button
              onClick={() => { setShowSpeciesPicker(false); setSpeciesQuery(''); }}
              className="w-full text-sm text-forest-500 hover:text-forest-300 py-2 border-t border-forest-800"
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* GPS */}
      <section className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-forest-500">Location</label>
        <div className="flex items-center gap-3">
          {settings.gpsEnabled ? (
            <button
              onClick={captureGps}
              disabled={gpsLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-forest-900 border border-forest-700 rounded-xl text-sm font-medium text-forest-300 hover:border-forest-500 transition-colors disabled:opacity-50"
            >
              <MapPinIcon className="h-4 w-4" />
              {gpsLoading ? 'Getting location…' : gpsCoords ? 'Update GPS' : 'Capture GPS'}
            </button>
          ) : (
            <p className="text-xs text-forest-500">GPS disabled — enable in Settings.</p>
          )}
          {gpsCoords && (
            <span className="text-xs text-forest-400 font-mono">
              {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
            </span>
          )}
        </div>
        {gpsError && <p className="text-xs text-red-400">{gpsError}</p>}
      </section>

      {/* Habitats */}
      <section className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-forest-500">Habitats</label>
        <div className="flex flex-wrap gap-2">
          {HABITATS.map(h => (
            <button
              key={h}
              onClick={() => toggleHabitat(h)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                selectedHabitats.includes(h)
                  ? 'bg-forest-600 text-forest-100'
                  : 'bg-forest-900 border border-forest-700 text-forest-400 hover:text-forest-300'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </section>

      {/* Bird count */}
      <section className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-forest-500">Bird Count</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setBirdCount(c => Math.max(1, c - 1))}
            className="h-9 w-9 rounded-full bg-forest-800 border border-forest-700 text-forest-200 text-lg font-bold flex items-center justify-center hover:bg-forest-700 transition-colors"
          >
            −
          </button>
          <span className="text-2xl font-bold text-forest-100 w-10 text-center">{birdCount}</span>
          <button
            onClick={() => setBirdCount(c => c + 1)}
            className="h-9 w-9 rounded-full bg-forest-800 border border-forest-700 text-forest-200 text-lg font-bold flex items-center justify-center hover:bg-forest-700 transition-colors"
          >
            +
          </button>
        </div>
      </section>

      {/* Weather */}
      <section className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-forest-500">Weather</label>
        <select
          value={weather}
          onChange={e => setWeather(e.target.value)}
          className="w-full bg-forest-900 border border-forest-700 rounded-xl px-3 py-2.5 text-sm text-forest-100 focus:outline-none focus:border-forest-500"
        >
          <option value="">Select weather…</option>
          {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </section>

      {/* Notes */}
      <section className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-forest-500">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Behavior, plumage details, song, location notes…"
          className="w-full bg-forest-900 border border-forest-700 rounded-xl px-3 py-2.5 text-sm text-forest-100 placeholder-forest-500 focus:outline-none focus:border-forest-500 resize-none"
        />
      </section>

      {/* Actions */}
      <div className={`grid gap-3 pt-2 ${selectedSpecies ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <button
          onClick={() => saveSighting('unknown')}
          disabled={saving}
          className="flex items-center justify-center gap-2 py-3 bg-bark-800 border border-bark-700 hover:bg-bark-700 text-bark-200 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
        >
          Save Unknown
        </button>
        {selectedSpecies && (
          <button
            onClick={() => saveSighting('pending')}
            disabled={saving}
            className="flex items-center justify-center gap-2 py-3 bg-forest-900 border border-forest-700 hover:bg-forest-800 text-forest-200 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
          >
            Save for Review
          </button>
        )}
        <button
          onClick={() => saveSighting('confirmed')}
          disabled={saving || !selectedSpecies}
          className="flex items-center justify-center gap-2 py-3 bg-forest-700 hover:bg-forest-600 text-forest-100 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
        >
          <CheckIcon className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Sighting'}
        </button>
      </div>
    </div>
  );
}
