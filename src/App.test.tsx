import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { initializeDatabase } from './db/init';

vi.mock('./db/init', () => ({
  initializeDatabase: vi.fn(),
}));

vi.mock('./pages/Home', () => ({
  Home: () => <div>Mock Home</div>,
}));

vi.mock('./pages/Regions', () => ({
  Regions: () => <div>Mock Regions</div>,
}));

vi.mock('./pages/BirdGuide', () => ({
  BirdGuide: () => <div>Mock Bird Guide</div>,
}));

vi.mock('./pages/AddSighting', () => ({
  AddSighting: () => <div>Mock Add Sighting</div>,
}));

vi.mock('./pages/Sightings', () => ({
  Sightings: () => <div>Mock Sightings</div>,
}));

vi.mock('./pages/LifeList', () => ({
  LifeList: () => <div>Mock Life List</div>,
}));

vi.mock('./pages/Settings', () => ({
  Settings: () => <div>Mock Settings</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.mocked(initializeDatabase).mockResolvedValue(undefined);
    document.documentElement.classList.remove('dark');
    window.location.hash = '#/settings';
  });

  afterEach(() => {
    window.location.hash = '#/';
  });

  it('boots the app shell and renders the current route', async () => {
    render(<App />);

    await waitFor(() => {
      expect(initializeDatabase).toHaveBeenCalledTimes(1);
    });

    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByText('Hunters-Bird')).toBeInTheDocument();
    expect(screen.getByText('Mock Settings')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page');
  });
});