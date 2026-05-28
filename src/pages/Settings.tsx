import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { normalizeAppSettings, useSettings, updateSettings } from '../hooks/useSettings';
import { createBackupPayload, deserializePhotoAsset, parseBackupPayload } from '../lib/backup';
import { DEFAULT_REGION_PACK_ID, resetRegionPackData } from '../lib/regionPacks';
import { APP_THEME_OPTIONS, applyThemeToDocument } from '../lib/theme';
import type { AppTheme } from '../types';

export function Settings() {
  const settings = useSettings();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const [sightingCount, photoCount] = [
    useLiveQuery(() => db.sightings.count(), []),
    useLiveQuery(() => db.photos.count(), []),
  ];

  async function clearAllData() {
    if (!confirm('This will delete all sightings, photos, and downloaded packs. Continue?')) return;
    await Promise.all([
      db.sightings.clear(),
      db.photos.clear(),
      db.inaturalistTaxa.clear(),
    ]);
    await resetRegionPackData();
    await updateSettings({ downloadedPackIds: [DEFAULT_REGION_PACK_ID], activeRegionPackId: DEFAULT_REGION_PACK_ID });
  }

  async function exportBackup() {
    setBackupError(null);
    setBackupMessage(null);

    const [sightings, photos, savedSettings] = await Promise.all([
      db.sightings.toArray(),
      db.photos.toArray(),
      db.settings.get('singleton'),
    ]);

    const payload = await createBackupPayload({
      sightings,
      photos,
      settings: savedSettings,
    });

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hunters-bird-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage(`Backup exported with ${sightings.length} sightings and ${photos.length} photos.`);
  }

  async function restoreBackup(file: File) {
    setRestoring(true);
    setBackupError(null);
    setBackupMessage(null);

    try {
      const payload = parseBackupPayload(await file.text());
      if (!confirm('Restore this backup? This replaces local sightings and stored photos on this device.')) return;

      const photos = payload.photos.map(deserializePhotoAsset);
      const restoredSettings = payload.settings ? normalizeAppSettings(payload.settings) : undefined;
      await db.transaction('rw', db.sightings, db.photos, db.settings, async () => {
        await db.sightings.clear();
        await db.photos.clear();
        if (payload.sightings.length > 0) await db.sightings.bulkPut(payload.sightings);
        if (photos.length > 0) await db.photos.bulkPut(photos);
        if (restoredSettings) await db.settings.put(restoredSettings);
      });

      if (restoredSettings) {
        applyThemeToDocument(restoredSettings);
      }

      setBackupMessage(`Backup restored: ${payload.sightings.length} sightings and ${photos.length} photos loaded.`);
    } catch (error) {
      setBackupError(error instanceof Error ? error.message : 'Could not restore the backup file.');
    } finally {
      setRestoring(false);
      if (restoreInputRef.current) restoreInputRef.current.value = '';
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-forest-100">Settings</h1>

      {/* Preferences */}
      <section className="space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-forest-500 mb-3">Preferences</h2>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-forest-100">App Theme</p>
            <p className="text-xs text-forest-500 mt-0.5">Switch between the default field guide shell and an optional retro Pokedex layout.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {APP_THEME_OPTIONS.map((option) => (
              <ThemeCard
                key={option.id}
                theme={option.id}
                label={option.label}
                badge={option.badge}
                description={option.description}
                selected={settings.theme === option.id}
                onSelect={() => {
                  void updateSettings({ theme: option.id });
                  applyThemeToDocument({ ...settings, theme: option.id });
                }}
              />
            ))}
          </div>
        </div>

        <ToggleRow
          label="Dark Mode"
          description="Use the dark nature-inspired theme"
          enabled={settings.darkMode}
          onChange={val => {
            void updateSettings({ darkMode: val });
            applyThemeToDocument({ ...settings, darkMode: val });
          }}
        />

        <ToggleRow
          label="GPS"
          description="Attach location to new sightings"
          enabled={settings.gpsEnabled}
          onChange={val => { void updateSettings({ gpsEnabled: val }); }}
        />
      </section>

      {/* Storage */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-forest-500">Storage</h2>
        <div className="bg-forest-900 border border-forest-800 rounded-xl p-4 space-y-2">
          <StorageRow label="Sightings saved" value={String(sightingCount ?? 0)} />
          <StorageRow label="Photos stored" value={String(photoCount ?? 0)} />
          <StorageRow label="Region packs" value={String(settings.downloadedPackIds.length)} />
        </div>
      </section>

      {/* Data actions */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-forest-500">Data</h2>

        <ActionButton
          label="Export Backup"
          description="Download sightings, photos, and settings as a backup JSON file"
          onClick={exportBackup}
          variant="default"
        />

        <ActionButton
          label={restoring ? 'Restoring Backup…' : 'Restore Backup'}
          description="Replace local sightings and photos from a Hunters-Bird backup file"
          onClick={() => restoreInputRef.current?.click()}
          variant="default"
        />

        <input
          ref={restoreInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void restoreBackup(file);
            }
          }}
        />

        {backupMessage && <p className="text-xs text-forest-400">{backupMessage}</p>}
        {backupError && <p className="text-xs text-red-400">{backupError}</p>}

        <ActionButton
          label="Clear All Data"
          description="Delete all sightings and photos from this device"
          onClick={clearAllData}
          variant="danger"
        />
      </section>

      {/* About */}
      <section className="rounded-xl bg-forest-900 border border-forest-800 p-4 space-y-1">
        <p className="font-semibold text-forest-200">Hunters-Bird</p>
        <p className="text-xs text-forest-500">v0.1.0 · Offline-capable birding for hikers &amp; naturalists</p>
        <p className="text-xs text-forest-600 mt-2">No account required · All data stays on your device</p>
      </section>
    </div>
  );
}

function ToggleRow({
  label, description, enabled, onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-forest-900 border border-forest-800 rounded-xl px-4 py-3">
      <div className="flex-1">
        <p className="font-medium text-forest-100 text-sm">{label}</p>
        <p className="text-xs text-forest-500 mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-forest-500' : 'bg-forest-800 border border-forest-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function ThemeCard({
  theme,
  label,
  badge,
  description,
  selected,
  onSelect,
}: {
  theme: AppTheme;
  label: string;
  badge: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const previewClass = theme === 'pokedex'
    ? 'bg-[linear-gradient(140deg,#ef4444_0%,#b91c1c_44%,#111827_45%,#0f172a_100%)]'
    : 'bg-[linear-gradient(140deg,#3a5c2b_0%,#1a1f14_55%,#0d1309_100%)]';

  return (
    <button
      onClick={onSelect}
      className={`rounded-2xl border p-4 text-left transition-colors ${
        selected
          ? 'bg-forest-800 border-forest-500'
          : 'bg-forest-900 border-forest-800 hover:bg-forest-800'
      }`}
    >
      <div className={`mb-3 h-20 rounded-xl border border-white/10 p-3 ${previewClass}`}>
        <div className="flex h-full items-start justify-between">
          <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/85">
            {badge}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-white/80" />
            {theme === 'pokedex' && <span className="h-6 w-6 rounded-full border-4 border-white/35 bg-white/10" />}
          </div>
        </div>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-sm text-forest-100">{label}</p>
          <p className="text-xs text-forest-500 mt-0.5">{description}</p>
        </div>
        {selected && (
          <span className="rounded-full bg-forest-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-forest-100">
            Active
          </span>
        )}
      </div>
    </button>
  );
}

function StorageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-forest-400">{label}</span>
      <span className="text-sm font-semibold text-forest-200">{value}</span>
    </div>
  );
}

function ActionButton({
  label, description, onClick, variant,
}: {
  label: string;
  description: string;
  onClick: () => void;
  variant: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
        variant === 'danger'
          ? 'bg-forest-900 border-red-900 hover:bg-red-950 hover:border-red-800'
          : 'bg-forest-900 border-forest-800 hover:bg-forest-800'
      }`}
    >
      <p className={`font-medium text-sm ${variant === 'danger' ? 'text-red-400' : 'text-forest-200'}`}>
        {label}
      </p>
      <p className="text-xs text-forest-500 mt-0.5">{description}</p>
    </button>
  );
}
