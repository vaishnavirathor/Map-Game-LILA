"use client";

import type { MatchMeta } from "@/lib/types";
import { MAP_DISPLAY_NAMES, DATE_DIRS } from "@/lib/types";

interface FilterBarProps {
  matches: MatchMeta[];
  selectedMap: string;
  selectedDate: string;
  selectedMatchId: string;
  showHumans: boolean;
  showBots: boolean;
  showEventTypes: Set<string>;
  onMapChange: (map: string) => void;
  onDateChange: (date: string) => void;
  onMatchChange: (matchId: string) => void;
  onHumansChange: (v: boolean) => void;
  onBotsChange: (v: boolean) => void;
  onEventTypeToggle: (event: string) => void;
  onResetView: () => void;
}

const EVENT_TYPE_OPTIONS = [
  { id: "Position", label: "Human Movement" },
  { id: "BotPosition", label: "Bot Movement" },
];

export default function FilterBar({
  matches,
  selectedMap,
  selectedDate,
  selectedMatchId,
  showHumans,
  showBots,
  showEventTypes,
  onMapChange,
  onDateChange,
  onMatchChange,
  onHumansChange,
  onBotsChange,
  onEventTypeToggle,
  onResetView,
}: FilterBarProps) {
  const filteredMatches = matches.filter((m) => {
    if (selectedMap !== "all" && m.map_id !== selectedMap) return false;
    if (selectedDate !== "all" && !m.dates.includes(selectedDate)) return false;
    return true;
  });

  const uniqueDates = [...new Set(matches.flatMap((m) => m.dates))].sort(
    (a, b) => DATE_DIRS.indexOf(a) - DATE_DIRS.indexOf(b)
  );

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-sm">
      <div className="flex items-center gap-2">
        <label className="text-zinc-400 font-medium text-xs">Map:</label>
        <select
          value={selectedMap}
          onChange={(e) => onMapChange(e.target.value)}
          className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-zinc-200 text-sm w-[150px]"
        >
          <option value="all">All Maps</option>
          {Object.entries(MAP_DISPLAY_NAMES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-zinc-400 font-medium text-xs">Date:</label>
        <select
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-zinc-200 text-sm w-[150px]"
        >
          <option value="all">All Dates</option>
          {uniqueDates.map((d) => (
            <option key={d} value={d}>{d.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-zinc-400 font-medium text-xs">Match:</label>
        <select
          value={selectedMatchId}
          onChange={(e) => onMatchChange(e.target.value)}
          className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-zinc-200 text-sm max-w-[200px]"
        >
          <option value="all">All Matches</option>
          {filteredMatches.map((m) => (
            <option key={m.match_id} value={m.match_id}>
              {m.match_id.slice(0, 8)}... ({m.map_id.slice(0,2)}{m.map_id.slice(-2)} - {m.human_count}h/{m.bot_count}b)
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <span className="text-zinc-500 text-xs">Display:</span>
        <label className="flex items-center gap-1.5 cursor-pointer text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={showHumans}
            onChange={(e) => onHumansChange(e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
          />
          Humans
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={showBots}
            onChange={(e) => onBotsChange(e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
          />
          Bots
        </label>
      </div>

      <div className="w-full flex flex-wrap items-center gap-2 mt-1">
        <span className="text-zinc-500 text-xs">Movement types:</span>
        {EVENT_TYPE_OPTIONS.map((opt) => (
          <label
            key={opt.id}
            className={`text-xs px-2 py-0.5 rounded cursor-pointer border transition-colors ${
              showEventTypes.has(opt.id)
                ? "bg-zinc-700 border-zinc-500 text-zinc-200"
                : "bg-zinc-800 border-zinc-700 text-zinc-500"
            }`}
          >
            <input
              type="checkbox"
              checked={showEventTypes.has(opt.id)}
              onChange={() => onEventTypeToggle(opt.id)}
              className="hidden"
            />
            {opt.label}
          </label>
        ))}

        <button
          onClick={onResetView}
          className="ml-auto text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-600 text-zinc-400 hover:bg-zinc-700 transition-colors"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}
