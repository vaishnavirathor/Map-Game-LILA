"use client";

import { EVENT_COLORS, EVENT_LABELS } from "@/lib/types";

interface EventLegendProps {
  showEventTypes: Set<string>;
  onEventTypeToggle: (event: string) => void;
}

const COMBAT_EVENTS = ["Kill", "Killed", "BotKill", "BotKilled", "KilledByStorm", "Loot"];

export default function EventLegend({
  showEventTypes,
  onEventTypeToggle,
}: EventLegendProps) {
  return (
    <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        Event Markers
      </h3>
      <div className="grid grid-cols-2 gap-1">
        {COMBAT_EVENTS.map((evt) => (
          <label
            key={evt}
            className={`flex items-center gap-2 text-xs cursor-pointer px-2 py-1 rounded ${
              showEventTypes.has(evt)
                ? "bg-zinc-800 text-zinc-200"
                : "text-zinc-500"
            }`}
          >
            <input
              type="checkbox"
              checked={showEventTypes.has(evt)}
              onChange={() => onEventTypeToggle(evt)}
              className="hidden"
            />
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: EVENT_COLORS[evt] }}
            />
            {EVENT_LABELS[evt]}
          </label>
        ))}
      </div>
    </div>
  );
}
