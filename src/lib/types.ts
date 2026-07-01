export interface MapConfig {
  scale: number;
  origin_x: number;
  origin_z: number;
}

export const MAP_CONFIGS: Record<string, MapConfig> = {
  AmbroseValley: { scale: 900, origin_x: -370, origin_z: -473 },
  GrandRift: { scale: 581, origin_x: -290, origin_z: -290 },
  Lockdown: { scale: 1000, origin_x: -500, origin_z: -500 },
};

export const MAP_DISPLAY_NAMES: Record<string, string> = {
  AmbroseValley: "Ambrose Valley",
  GrandRift: "Grand Rift",
  Lockdown: "Lockdown",
};

export const MINIMAP_SIZE = 1024;

export interface GameEvent {
  user_id: string;
  match_id: string;
  map_id: string;
  x: number;
  z: number;
  px: number | null;
  py: number | null;
  ts: number;
  event: string;
  is_bot: boolean;
  is_combat: boolean;
  rel_ts?: number;
}

export interface MatchMeta {
  match_id: string;
  map_id: string;
  dates: string[];
  human_count: number;
  bot_count: number;
  total_players: number;
}

export interface HeatmapData {
  kill_positions: number[][];
  death_positions: number[][];
  storm_death_positions: number[][];
  loot_positions: number[][];
  movement_positions: number[][];
  kill_count: number;
  death_count: number;
  storm_death_count: number;
  loot_count: number;
}

export type HeatmapType = "kill" | "death" | "storm" | "loot" | "traffic";

export const DATE_DIRS = [
  "February_10",
  "February_11",
  "February_12",
  "February_13",
  "February_14",
];

export const EVENT_COLORS: Record<string, string> = {
  Kill: "#ef4444",
  Killed: "#f97316",
  BotKill: "#a855f7",
  BotKilled: "#d946ef",
  KilledByStorm: "#3b82f6",
  Loot: "#22c55e",
  Position: "#94a3b8",
  BotPosition: "#64748b",
};

export const EVENT_LABELS: Record<string, string> = {
  Kill: "Player Kill",
  Killed: "Player Died",
  BotKill: "Bot Kill",
  BotKilled: "Killed by Bot",
  KilledByStorm: "Storm Death",
  Loot: "Loot Pickup",
  Position: "Movement (Human)",
  BotPosition: "Movement (Bot)",
};
