import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-forest-950 text-forest-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-forest-900/95 backdrop-blur border-b border-forest-800 safe-top">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto w-full">
          {/* Brand mark */}
          <span className="text-2xl" role="img" aria-label="bird">🦅</span>
          <span className="font-bold text-forest-200 tracking-wide text-lg">Hunters-Bird</span>
          <div className="flex-1" />
          {/* Offline indicator */}
          <OfflineIndicator />
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>

      <BottomNav />
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
