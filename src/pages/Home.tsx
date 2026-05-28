import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PlusCircleIcon, MapIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { db } from '../db/database';
import { useSettings } from '../hooks/useSettings';
import { formatDate, formatTime } from '../lib/utils';
import type { RegionPack } from '../types';

export function Home() {
  const settings = useSettings();

  const activeRegion = useLiveQuery<RegionPack | undefined>(
    () => settings.activeRegionPackId ? db.regionPacks.get(settings.activeRegionPackId) : Promise.resolve(undefined),
    [settings.activeRegionPackId],
  );

  const recentSightings = useLiveQuery(
    () => db.sightings.orderBy('createdAt').reverse().limit(5).toArray(),
    [],
  );

  return (
    <div className="p-4 space-y-6">
      {/* Hero greeting */}
      <section className="pokedex-panel pokedex-panel-hero rounded-2xl bg-forest-800 border border-forest-700 p-5">
        <p className="text-forest-400 text-sm font-medium uppercase tracking-widest mb-1">Active Region</p>
        {activeRegion ? (
          <>
            <h1 className="text-2xl font-bold text-forest-100">{activeRegion.name}</h1>
            <p className="text-forest-400 text-sm mt-1">{activeRegion.description}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {activeRegion.states.slice(0, 4).map(s => (
                <span key={s} className="pokedex-chip text-xs bg-forest-700 text-forest-300 px-2 py-0.5 rounded-full">{s}</span>
              ))}
              {activeRegion.states.length > 4 && (
                <span className="pokedex-chip text-xs bg-forest-700 text-forest-300 px-2 py-0.5 rounded-full">
                  +{activeRegion.states.length - 4} more
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-forest-400">
            <p className="font-semibold text-forest-200">No region selected</p>
            <Link to="/regions" className="pokedex-inline-link text-forest-400 text-sm underline mt-1 block">Choose a region →</Link>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-forest-500 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <QuickAction to="/add-sighting" icon={<PlusCircleIcon className="h-6 w-6" />} label="Log Bird" accent />
          <QuickAction to="/regions" icon={<MapIcon className="h-6 w-6" />} label="Regions" />
          <QuickAction to="/bird-guide" icon={<BookOpenIcon className="h-6 w-6" />} label="Bird Guide" />
        </div>
      </section>

      {/* Recent sightings */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-forest-500">Recent Sightings</h2>
          <Link to="/sightings" className="pokedex-inline-link text-forest-400 text-xs hover:text-forest-300">View all →</Link>
        </div>
        {recentSightings && recentSightings.length > 0 ? (
          <div className="space-y-2">
            {recentSightings.map(s => (
              <div key={s.id} className="pokedex-panel pokedex-list-card flex items-center gap-3 bg-forest-900 rounded-xl p-3 border border-forest-800">
                <div className="pokedex-icon-well h-10 w-10 rounded-lg bg-forest-800 flex items-center justify-center text-xl shrink-0">
                  🐦
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-forest-100 truncate">
                    {s.speciesNameSnapshot ?? 'Unknown bird'}
                  </p>
                  <p className="text-xs text-forest-500">{formatDate(s.createdAt)} · {formatTime(s.createdAt)}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            emoji="🔭"
            title="No sightings yet"
            subtitle="Head out and log your first bird!"
            action={{ label: 'Log a Bird', to: '/add-sighting' }}
          />
        )}
      </section>
    </div>
  );
}

function QuickAction({
  to, icon, label, accent,
}: { to: string; icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <Link
      to={to}
      className={`pokedex-button-card flex flex-col items-center gap-2 p-4 rounded-xl border font-medium text-sm transition-colors ${
        accent
          ? 'pokedex-button-primary bg-forest-700 border-forest-600 text-forest-100 hover:bg-forest-600'
          : 'pokedex-button-secondary bg-forest-900 border-forest-800 text-forest-300 hover:bg-forest-800'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'bg-forest-700 text-forest-300',
    unknown:   'bg-bark-800 text-bark-300',
    pending:   'bg-forest-800 text-forest-400',
  };
  return (
    <span className={`pokedex-badge text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}

function EmptyState({
  emoji, title, subtitle, action,
}: { emoji: string; title: string; subtitle: string; action?: { label: string; to: string } }) {
  return (
    <div className="pokedex-empty-state flex flex-col items-center gap-2 py-10 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="font-semibold text-forest-300">{title}</p>
      <p className="text-sm text-forest-500">{subtitle}</p>
      {action && (
        <Link
          to={action.to}
          className="pokedex-button-primary mt-2 px-4 py-2 bg-forest-700 hover:bg-forest-600 text-forest-100 rounded-xl text-sm font-medium transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
