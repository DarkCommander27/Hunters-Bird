import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Regions } from './pages/Regions';
import { BirdGuide } from './pages/BirdGuide';
import { AddSighting } from './pages/AddSighting';
import { Sightings } from './pages/Sightings';
import { LifeList } from './pages/LifeList';
import { Settings } from './pages/Settings';
import { initializeDatabase } from './db/init';
import { DEFAULT_SETTINGS } from './lib/regionPacks';
import { applyThemeToDocument } from './lib/theme';

export default function App() {
  useEffect(() => {
    initializeDatabase().catch(console.error);

    // Seed the root classes with the default theme until the saved settings load.
    applyThemeToDocument(DEFAULT_SETTINGS);

    // Offline/online indicator
    const badge = document.getElementById('offline-badge');
    function updateOnlineStatus() {
      if (badge) badge.classList.toggle('hidden', navigator.onLine);
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="regions" element={<Regions />} />
          <Route path="bird-guide" element={<BirdGuide />} />
          <Route path="add-sighting" element={<AddSighting />} />
          <Route path="sightings" element={<Sightings />} />
          <Route path="life-list" element={<LifeList />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
