import type { GameEvent, MatchMeta, HeatmapData } from "./types";

const DATA_BASE = "/data";

export async function loadMatches(): Promise<MatchMeta[]> {
  const res = await fetch(`${DATA_BASE}/matches.json`);
  if (!res.ok) throw new Error("Failed to load matches");
  return res.json();
}

export async function loadMatchData(matchId: string): Promise<GameEvent[]> {
  const res = await fetch(`${DATA_BASE}/matches/${encodeURIComponent(matchId)}.json`);
  if (!res.ok) throw new Error(`Failed to load match ${matchId}`);
  return res.json();
}

export async function loadAllEvents(): Promise<GameEvent[]> {
  const res = await fetch(`${DATA_BASE}/all_events.json`);
  if (!res.ok) throw new Error("Failed to load all events");
  return res.json();
}

export async function loadHeatmaps(): Promise<Record<string, HeatmapData>> {
  const res = await fetch(`${DATA_BASE}/heatmaps.json`);
  if (!res.ok) throw new Error("Failed to load heatmaps");
  return res.json();
}
