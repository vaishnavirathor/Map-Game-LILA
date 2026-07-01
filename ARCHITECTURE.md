# ARCHITECTURE — LILA BLACK Player Journey Explorer

## Overview

A web-based visualization tool for LILA BLACK gameplay data. Level designers explore **player movement paths, combat events, and heatmaps** overlaid on game minimaps across 796 matches and 89,000 events.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS. Hosted on Vercel.

---

## Data Flow

```
Raw Parquet (1,243 files, ~8 MB)
    │
    ▼ scripts/preprocess.py
Preprocessed JSON (~24 MB total)
    │
    ├── matches.json       (1 file, 796 match metadata entries)
    ├── heatmaps.json      (1 file, per-map aggregate positions)
    └── matches/*.json     (796 files, one per match, lazy-loaded)
    │
    ▼ fetch() at runtime
React Components
    │
    ▼ Canvas 2D
Rendered minimaps + trails + markers + heatmaps
```

### Why preprocessing?

Parquet parsing in the browser requires WASM (DuckDB, arrow-wasm) — heavy, brittle, and slow for 1,243 files. Running `scripts/preprocess.py` once produces static JSON that loads instantly via `fetch()`. Match files average ~29 KB, fine for on-demand loading.

---

## Coordinate System

The game uses a 3D world coordinate system `(x, y, z)` where `y` is elevation. For 2D minimap plotting, only `x` and `z` are used.

### World → Minimap Pixel (1024 × 1024)

```
u = (x - origin_x) / scale    // normalize to [0, 1]
v = (z - origin_z) / scale

pixel_x = u * 1024
pixel_y = (1 - v) * 1024     // Y flipped: image origin is top-left
```

| Map | Scale | Origin (x, z) |
|---|---|---|
| AmbroseValley | 900 | (-370, -473) |
| GrandRift | 581 | (-290, -290) |
| Lockdown | 1000 | (-500, -500) |

Conversion is done once in `scripts/preprocess.py` and stored as `px`/`py` fields in JSON. The frontend only needs `worldToScreen` (px → canvas pixel) using `canvasWidth / 1024`.

### Canvas Rendering

Simplified approach (no zoom/pan): both the minimap image and all trails/markers are drawn at the same scale factor `canvasWidth / 1024`, scaled up with `ctx.drawImage()` and `ctx.scale()`. This guarantees alignment at all canvas sizes.

---

## Component Architecture

```
page.tsx (state orchestration)
├── FilterBar         — map, date, match dropdowns + human/bot toggles
├── MatchTimeline     — scrubber, play/pause, speed control (zero hooks)
├── MapCanvas         — dual-canvas minimap + overlay (trails, markers, heatmaps)
├── EventLegend       — toggleable event type checkboxes
└── HeatmapOverlay    — heatmap mode selector (kill/death/storm/loot/traffic)
```

### MapCanvas internals

- **Background canvas**: draws the minimap PNG/JPG via `drawImage()`
- **Overlay canvas**: draws player trails (polylines), event markers (circles, crosses, icons), and heatmap layers (off-screen canvas with radial gradients + color tint)
- Both canvases use the same `worldToScreen()` scale — no zoom/pan complexity

### Key design decisions

| Decision | Rationale |
|---|---|
| No beUI components | beUI's animated Select/Switch import their own React instance from a remote CDN, causing "Rendered more hooks" errors. Replaced with native `<select>` and checkboxes. |
| Zero-hooks MatchTimeline | React 19 exhibited hooks ordering bugs with useRef/useState/useEffect in rapid re-renders. Rewrote timeline with inline functions. |
| Lazy per-match loading | 796 individual JSON files (~29 KB avg), fetched on demand instead of loading 89k events at once. |
| No zoom/pan | Removed after persistent alignment issues. Minimap and overlays now use a fixed `canvasWidth / 1024` ratio. Simpler, zero drift. |
| Dual canvas | Separate `<canvas>` elements for background (minimap) and foreground (trails/markers/heatmaps). Avoids redrawing the image on every overlay update. |

---

## Data Files

| File | Size | Contents |
|---|---|---|
| `public/data/matches.json` | ~100 KB | 796 match metadata (map, dates, player counts) |
| `public/data/heatmaps.json` | ~200 KB | Per-map aggregate positions for 5 heatmap types |
| `public/data/matches/*.json` | ~24 MB total | 796 files, one per match, each with all events for that match |
| `public/minimaps/` | ~24 MB | 3 minimap images (PNG/JPG) |

---

## Deployment

Static export from Next.js → Vercel. All data is preprocessed into `public/`, served as static assets along with the app bundle. No server-side logic needed.