"use client";

import type { HeatmapType } from "@/lib/types";

interface HeatmapOverlayProps {
  heatmapType: HeatmapType | null;
  onHeatmapChange: (type: HeatmapType | null) => void;
}

const HEATMAP_OPTIONS: { id: HeatmapType; label: string; desc: string }[] = [
  { id: "kill", label: "Kill Zones", desc: "Where players kill others" },
  { id: "death", label: "Death Zones", desc: "Where players die" },
  { id: "storm", label: "Storm Deaths", desc: "Where players die to storm" },
  { id: "loot", label: "Loot Hotspots", desc: "Where loot is picked up" },
  { id: "traffic", label: "Traffic", desc: "Player movement density" },
];

export default function HeatmapOverlay({
  heatmapType,
  onHeatmapChange,
}: HeatmapOverlayProps) {
  return (
    <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        Heatmaps
      </h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onHeatmapChange(null)}
          className={`text-xs px-2 py-1 rounded border ${
            heatmapType === null
              ? "bg-zinc-700 border-zinc-500 text-zinc-200"
              : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700"
          }`}
        >
          None
        </button>
        {HEATMAP_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() =>
              onHeatmapChange(heatmapType === opt.id ? null : opt.id)
            }
            className={`text-xs px-2 py-1 rounded border ${
              heatmapType === opt.id
                ? "bg-zinc-700 border-zinc-500 text-zinc-200"
                : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
