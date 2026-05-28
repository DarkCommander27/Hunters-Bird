import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useSettings } from '../hooks/useSettings';
import { applyThemeToDocument } from '../lib/theme';

export function Layout() {
  const settings = useSettings();
  const { darkMode, theme } = settings;
  const isPokedex = theme === 'pokedex';

  useEffect(() => {
    applyThemeToDocument({ darkMode, theme });
  }, [darkMode, theme]);

  return (
    <div className="relative min-h-screen bg-forest-950 text-forest-50 flex flex-col overflow-hidden">
      {isPokedex && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.38),transparent_58%)]" />
          <div className="pointer-events-none absolute right-[-3rem] top-12 h-40 w-40 rounded-full border-[18px] border-forest-700/20" />
        </>
      )}

      {/* Top bar */}
      <header className={`sticky top-0 z-40 safe-top ${
        isPokedex
          ? 'pokedex-header border-b-4 border-slate-950/80 shadow-[0_10px_30px_rgba(0,0,0,0.35)]'
          : 'bg-forest-900/95 backdrop-blur border-b border-forest-800'
      }`}>
        <div className={`flex items-center gap-3 h-14 mx-auto w-full ${isPokedex ? 'max-w-4xl px-5' : 'max-w-2xl px-4'}`}>
          {/* Brand mark */}
          <span
            className={isPokedex ? 'pokedex-emblem grid h-9 w-9 place-items-center rounded-full text-lg font-black text-white' : 'text-2xl'}
            role="img"
            aria-label={isPokedex ? 'pokedex theme' : 'bird'}
          >
            {isPokedex ? '◉' : '🦅'}
          </span>
          <div className="flex flex-col leading-none">
            <span className={`font-bold tracking-wide ${isPokedex ? 'text-xl text-forest-50' : 'text-lg text-forest-200'}`}>Hunters-Bird</span>
            {isPokedex && (
              <span className="text-[10px] uppercase tracking-[0.35em] text-forest-100/80">FieldDex Theme</span>
            )}
          </div>
          <div className="flex-1" />
          {isPokedex && <span className="pokedex-led hidden sm:inline-block h-3 w-3 rounded-full bg-forest-200" />}
          {/* Offline indicator */}
          <OfflineIndicator />
        </div>
      </header>

      {/* Page content */}
      <main className={`flex-1 overflow-y-auto pb-20 w-full ${isPokedex ? 'max-w-4xl mx-auto px-3 py-4' : 'max-w-2xl mx-auto'}`}>
        {isPokedex ? (
          <div className="pokedex-screen overflow-hidden rounded-[2rem] border-[6px] border-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-2 border-b border-forest-800 bg-forest-900/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-forest-300">
              <span className="h-2.5 w-2.5 rounded-full bg-forest-300 shadow-[0_0_12px_rgba(255,242,221,0.8)]" />
              Regional Field Index
            </div>
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <BottomNav theme={theme} />
    </div>
  );
}

function OfflineIndicator() {
  return (
    <span
      id="offline-badge"
      className="hidden text-xs px-2 py-0.5 rounded-full bg-bark-700 text-bark-200 font-medium"
    >
      Offline
    </span>
  );
}
