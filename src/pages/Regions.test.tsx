import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { Regions } from './Regions';
import { DEFAULT_REGION_PACK_ID, DEFAULT_SETTINGS, installRegionPack, syncRegionPackCatalog } from '../lib/regionPacks';

async function resetDatabaseState() {
  await db.delete();
  await db.open();
  await syncRegionPackCatalog();
  await db.settings.put(DEFAULT_SETTINGS);
  await installRegionPack(DEFAULT_REGION_PACK_ID);
}

describe('Regions', () => {
  beforeEach(async () => {
    await resetDatabaseState();
  });

  afterAll(async () => {
    await db.delete();
  });

  it('downloads, activates, and removes a pack through the page flow', async () => {
    render(<Regions />);

    const appalachiaCard = await screen.findByRole('region', { name: 'Appalachia' });
    const northeastCard = await screen.findByRole('region', { name: 'Northeast' });

    expect(within(appalachiaCard).getByText('Active')).toBeInTheDocument();
    expect(within(northeastCard).getByRole('button', { name: 'Download' })).toBeInTheDocument();

    fireEvent.click(within(northeastCard).getByRole('button', { name: 'Download' }));

    await waitFor(() => {
      expect(within(screen.getByRole('region', { name: 'Northeast' })).getByRole('button', { name: 'Set Active' })).toBeInTheDocument();
    });

    fireEvent.click(within(screen.getByRole('region', { name: 'Northeast' })).getByRole('button', { name: 'Set Active' }));

    await waitFor(() => {
      expect(within(screen.getByRole('region', { name: 'Northeast' })).getByText('Active')).toBeInTheDocument();
    });

    fireEvent.click(within(screen.getByRole('region', { name: 'Northeast' })).getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(within(screen.getByRole('region', { name: 'Appalachia' })).getByText('Active')).toBeInTheDocument();
      expect(within(screen.getByRole('region', { name: 'Northeast' })).getByRole('button', { name: 'Download' })).toBeInTheDocument();
    });
  });
});