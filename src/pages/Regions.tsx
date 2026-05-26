import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircleIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { db } from '../db/database';
import { useSettings, updateSettings } from '../hooks/useSettings';
import { AVAILABLE_REGION_PACKS } from '../data/seed';

export function Regions() {
  const settings = useSettings();
  const [loading, setLoading] = useState<string | null>(null);

  const storedPacks = useLiveQuery(() => db.regionPacks.toArray(), []);

  const packs = AVAILABLE_REGION_PACKS.map(def => {
    const stored = storedPacks?.find(p => p.id === def.id);
    return stored ?? def;
  });

  async function downloadPack(packId: string) {
    setLoading(packId);
    try {
      // Simulate download (in production this would fetch a JSON pack)
      await new Promise(r => setTimeout(r, 800));
      const def = AVAILABLE_REGION_PACKS.find(p => p.id === packId)!;
      await db.regionPacks.put({ ...def, downloadedAt: Date.now() });
      await updateSettings({
        downloadedPackIds: [...new Set([...settings.downloadedPackIds, packId])],
      });
    } finally {
      setLoading(null);
    }
  }

  async function removePack(packId: string) {
    if (packId === 'appalachia') return; // protect default
    await db.regionPacks.put({
      ...(storedPacks?.find(p => p.id === packId) ?? AVAILABLE_REGION_PACKS.find(p => p.id === packId)!),
      downloadedAt: undefined,
    });
    const next = settings.downloadedPackIds.filter(id => id !== packId);
    const active = settings.activeRegionPackId === packId ? (next[0] ?? undefined) : settings.activeRegionPackId;
    await updateSettings({ downloadedPackIds: next, activeRegionPackId: active });
  }

  async function setActive(packId: string) {
    await updateSettings({ activeRegionPackId: packId });
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-forest-100">Region Packs</h1>
      <p className="text-sm text-forest-400">
        Download a region pack to browse birds and log sightings offline.
        Appalachia is included by default.
      </p>

      <div className="space-y-3">
        {packs.map(pack => {
          const isDownloaded = !!pack.downloadedAt;
          const isActive = settings.activeRegionPackId === pack.id;
          const isLoading = loading === pack.id;

          return (
            <div
              key={pack.id}
              className={`rounded-xl border p-4 transition-colors ${
                isActive
                  ? 'bg-forest-800 border-forest-600'
                  : 'bg-forest-900 border-forest-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🗺️</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-forest-100">{pack.name}</h2>
                    {isActive && (
                      <span className="text-xs bg-forest-600 text-forest-200 px-2 py-0.5 rounded-full font-medium">
                        Active
                      </span>
                    )}
                    {pack.isDefault && (
                      <span className="text-xs bg-bark-800 text-bark-300 px-2 py-0.5 rounded-full font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-forest-400 mt-1">{pack.description}</p>
                  {pack.speciesCount > 0 && (
                    <p className="text-xs text-forest-500 mt-1">{pack.speciesCount} species</p>
                  )}
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {pack.states.slice(0, 3).map(s => (
                      <span key={s} className="text-xs bg-forest-800 text-forest-400 px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                    {pack.states.length > 3 && (
                      <span className="text-xs bg-forest-800 text-forest-400 px-1.5 py-0.5 rounded">
                        +{pack.states.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {isDownloaded ? (
                  <>
                    {!isActive && (
                      <button
                        onClick={() => setActive(pack.id)}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-forest-700 hover:bg-forest-600 text-forest-100 rounded-lg font-medium transition-colors"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Set Active
                      </button>
                    )}
                    {!pack.isDefault && (
                      <button
                        onClick={() => removePack(pack.id)}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-forest-900 hover:bg-red-900 border border-forest-700 text-forest-400 hover:text-red-300 rounded-lg font-medium transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => downloadPack(pack.id)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-forest-700 hover:bg-forest-600 disabled:opacity-50 text-forest-100 rounded-lg font-medium transition-colors"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    {isLoading ? 'Downloading…' : 'Download'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
