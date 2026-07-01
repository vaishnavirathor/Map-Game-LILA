# LILA BLACK — Player Journey Explorer

Visualize player movement, combat events, and heatmaps on LILA BLACK game minimaps.

**Live:** [map-game-lila-bl8v.vercel.app](https://map-game-lila-bl8v.vercel.app/)

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Stack: Next.js](https://img.shields.io/badge/stack-Next.js%2016-black.svg)

## Features

- **Minimap overlay** — player trails and event markers drawn on game minimaps
- **Filter by map, date, and match** — drill into any of 796 matches
- **Timeline playback** — scrub through a match second-by-second
- **Heatmaps** — kill zones, death zones, storm deaths, loot density, traffic patterns
- **Human vs bot distinction** — visually separate real players from AI bots

## Data

5 days of LILA BLACK production gameplay (Feb 10–14, 2026):
- **796 matches** across 3 maps (Ambrose Valley, Grand Rift, Lockdown)
- **~89,000 events** — movement, combat, looting, storm deaths
- **339 unique players** (humans + bots)

Raw data is in Apache Parquet format. A Python preprocessing script (`scripts/preprocess.py`) converts it to static JSON for the frontend.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for coordinate mapping, data flow, component design, and tradeoffs.

See [INSIGHTS.md](INSIGHTS.md) for 3 data-backed findings from the dataset.

## Getting Started

```bash
git clone https://github.com/vaishnavirathor/Map-Game-LILA.git
cd Map-Game-LILA
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Deploy

Deployed on [Vercel](https://vercel.com). Push to `main` triggers automatic deployment.

## License

MIT