import { MAP_CONFIGS, MINIMAP_SIZE } from "./types";

export function worldToPixel(
  x: number,
  z: number,
  mapId: string
): { px: number; py: number } | null {
  const cfg = MAP_CONFIGS[mapId];
  if (!cfg) return null;

  const u = (x - cfg.origin_x) / cfg.scale;
  const v = (z - cfg.origin_z) / cfg.scale;
  const px = u * MINIMAP_SIZE;
  const py = (1 - v) * MINIMAP_SIZE;
  return { px, py };
}

export function pixelToWorld(
  px: number,
  py: number,
  mapId: string
): { x: number; z: number } | null {
  const cfg = MAP_CONFIGS[mapId];
  if (!cfg) return null;

  const u = px / MINIMAP_SIZE;
  const v = 1 - py / MINIMAP_SIZE;
  const x = u * cfg.scale + cfg.origin_x;
  const z = v * cfg.scale + cfg.origin_z;
  return { x, z };
}
