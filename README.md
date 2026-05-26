# Hunters-Bird 🦅

A rugged, offline-capable birding PWA for hikers and naturalists. Works in the field — no account, no cloud required.

## Features

- **Offline-capable PWA** — installs to your home screen and works without internet
- **Local-first storage** — all sightings and photos stay on your device (IndexedDB via Dexie)
- **Regional bird packs** — download U.S. region packs; Appalachia included by default (24 species)
- **Bird Guide** — search and browse regional species with habitat and taxonomy filters
- **Log Sightings** — photo capture/upload, GPS coordinates, habitat tags, weather, bird count, notes
- **Unknown save + re-identify** — save unidentified birds and come back to them later
- **Life List** — automatic unique-species summary across all confirmed sightings
- **Dark mode** — nature-inspired dark theme, togglable from Settings
- **GPS support** — optional toggle, attaches coordinates to each sighting
- **Export** — download all sightings as JSON

## Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite 8 |
| Language | TypeScript |
| Styles | Tailwind CSS v4 |
| Routing | React Router v7 |
| Local DB | Dexie (IndexedDB) |
| PWA | vite-plugin-pwa + Workbox |
| Icons | Heroicons |

## Getting Started

```bash
# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Lint
npm run lint
```

## Project Structure

```
src/
├── components/      # Shared UI (Layout, BottomNav)
├── data/            # Static seed data (region packs, species)
├── db/              # Dexie database setup and initialisation
├── hooks/           # React hooks (useSettings)
├── lib/             # Pure utilities (id generation, date formatting, image compression)
├── pages/           # Route-level page components
│   ├── Home.tsx
│   ├── Regions.tsx
│   ├── BirdGuide.tsx
│   ├── AddSighting.tsx
│   ├── Sightings.tsx
│   ├── LifeList.tsx
│   └── Settings.tsx
└── types/           # Shared TypeScript types
```

## Available Region Packs

| Region | Status |
|--------|--------|
| **Appalachia** | ✅ Included (24 species) |
| Northeast | Available to download |
| Southeast | Available to download |
| Midwest | Available to download |
| Great Plains | Available to download |
| Southwest | Available to download |
| Rocky Mountains | Available to download |
| Pacific Coast | Available to download |

## Roadmap / Follow-up

- [ ] Online AI bird identification integration (pluggable provider interface ready)
- [ ] Edit sighting flow
- [ ] Map view of sightings
- [ ] Richer species data per region pack (photos, audio, similar species)
- [ ] State-level filtering inside packs
- [ ] Export as CSV / share life list
- [ ] Import backup from JSON
- [ ] iOS PWA install guidance
- [ ] Storage usage estimation (navigator.storage API)
