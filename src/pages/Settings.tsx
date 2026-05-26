import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useSettings, updateSettings } from '../hooks/useSettings';
import { createBackupPayload, deserializePhotoAsset, parseBackupPayload } from '../lib/backup';

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
    ]);
    await updateSettings({ downloadedPackIds: ['appalachia'] });
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
      await db.transaction('rw', db.sightings, db.photos, db.settings, async () => {
        await db.sightings.clear();
        await db.photos.clear();
        if (payload.sightings.length > 0) await db.sightings.bulkPut(payload.sightings);
        if (photos.length > 0) await db.photos.bulkPut(photos);
        if (payload.settings) await db.settings.put(payload.settings);
      });

      if (payload.settings) {
        document.documentElement.classList.toggle('dark', payload.settings.darkMode);
        document.documentElement.classList.toggle('light', !payload.settings.darkMode);
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

        <ToggleRow
          label="Dark Mode"
          description="Use the dark nature-inspired theme"
          enabled={settings.darkMode}
          onChange={val => {
            updateSettings({ darkMode: val });
            document.documentElement.classList.toggle('dark', val);
            document.documentElement.classList.toggle('light', !val);
          }}
        />

        <ToggleRow
          label="GPS"
          description="Attach location to new sightings"
          enabled={settings.gpsEnabled}
          onChange={val => updateSettings({ gpsEnabled: val })}
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
