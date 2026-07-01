"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { GameEvent, HeatmapType, HeatmapData } from "@/lib/types";
import { EVENT_COLORS, MAP_CONFIGS, MINIMAP_SIZE } from "@/lib/types";

interface MapCanvasProps {
  mapId: string;
  events: GameEvent[];
  showHumans: boolean;
  showBots: boolean;
  showEventTypes: Set<string>;
  heatmapType: HeatmapType | null;
  heatmapData: HeatmapData | null;
  currentTime: number | null;
  selectedPlayerId: string | null;
  onPlayerSelect: (userId: string | null) => void;
  highlightedEvent: GameEvent | null;
  onEventClick: (e: GameEvent | null) => void;
  onWorldCoordHover?: (x: number | null, z: number | null) => void;
}

const MINIMAP_PATH = "/minimaps";
const PLAYER_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#a855f7",
  "#f59e0b", "#ec4899", "#14b8a6", "#f97316",
  "#6366f1", "#84cc16", "#06b6d4", "#d946ef",
];

export default function MapCanvas({
  mapId,
  events,
  showHumans,
  showBots,
  showEventTypes,
  heatmapType,
  heatmapData,
  currentTime,
  selectedPlayerId,
  onPlayerSelect,
  highlightedEvent,
  onEventClick,
  onWorldCoordHover,
}: MapCanvasProps) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const getMinimapSrc = useCallback(() => {
    if (mapId === "Lockdown") return `${MINIMAP_PATH}/Lockdown_Minimap.jpg`;
    return `${MINIMAP_PATH}/${mapId}_Minimap.png`;
  }, [mapId]);

  const worldToScreen = useCallback((px: number, py: number) => {
    const ratio = canvasSize.w > 0 ? canvasSize.w / MINIMAP_SIZE : 1;
    return { sx: px * ratio, sy: py * ratio };
  }, [canvasSize.w]);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const ratio = canvasSize.w > 0 ? canvasSize.w / MINIMAP_SIZE : 1;
    return { px: sx / ratio, py: sy / ratio };
  }, [canvasSize.w]);

  const drawAll = useCallback(() => {
    const overlay = overlayRef.current;
    const bg = bgRef.current;
    if (!overlay || !bg) return;

    const w = overlay.clientWidth;
    const h = overlay.clientHeight;
    if (w === 0 || h === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const realW = w * dpr;
    const realH = h * dpr;

    if (canvasSize.w !== w || canvasSize.h !== h) {
      setCanvasSize({ w, h });
    }

    overlay.width = realW;
    overlay.height = realH;
    const octx = overlay.getContext("2d");
    if (!octx) return;
    octx.scale(dpr, dpr);
    octx.clearRect(0, 0, w, h);

    bg.width = realW;
    bg.height = realH;
    const bctx = bg.getContext("2d");
    if (!bctx) return;
    bctx.scale(dpr, dpr);
    bctx.clearRect(0, 0, w, h);

    const img = new Image();
    img.src = getMinimapSrc();
    const onImgReady = (image: HTMLImageElement) => {
      bctx.drawImage(image, 0, 0, w, h);

      if (heatmapType && heatmapData) {
        drawHeatmap(octx, w);
      }

      drawOverlays(octx, w);
    };

    if (img.complete) {
      onImgReady(img);
    } else {
      img.onload = () => onImgReady(img);
    }
  }, [events, showHumans, showBots, showEventTypes, heatmapType, heatmapData, currentTime, selectedPlayerId, getMinimapSrc, worldToScreen, canvasSize]);

  const drawHeatmap = (ctx: CanvasRenderingContext2D, w: number) => {
    if (!heatmapData || !heatmapType) return;

    let positions: number[][];
    switch (heatmapType) {
      case "kill": positions = heatmapData.kill_positions; break;
      case "death": positions = heatmapData.death_positions; break;
      case "storm": positions = heatmapData.storm_death_positions; break;
      case "loot": positions = heatmapData.loot_positions; break;
      case "traffic": positions = heatmapData.movement_positions; break;
      default: positions = [];
    }
    if (positions.length === 0) return;

    const off = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    off.width = w * dpr;
    off.height = (w / MINIMAP_SIZE * MINIMAP_SIZE) * dpr;
    const octx = off.getContext("2d");
    if (!octx) return;
    octx.scale(dpr, dpr);

    const r = Math.max(8, w * 0.025);
    const alpha = heatmapType === "traffic" ? 0.04 : 0.12;

    for (const [px, py] of positions) {
      const { sx, sy } = worldToScreen(px, py);
      const g = octx.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, `rgba(255,255,255,${alpha})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      octx.fillStyle = g;
      octx.fillRect(sx - r, sy - r, r * 2, r * 2);
    }

    ctx.drawImage(off, 0, 0);

    const tintMap: Record<string, string> = {
      kill: "rgba(239, 68, 68, 0.55)",
      death: "rgba(249, 115, 22, 0.55)",
      storm: "rgba(59, 130, 246, 0.55)",
      loot: "rgba(34, 197, 94, 0.55)",
      traffic: "rgba(168, 85, 247, 0.45)",
    };
    ctx.fillStyle = tintMap[heatmapType] || "rgba(255,0,0,0.3)";
    ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
  };

  const drawOverlays = (ctx: CanvasRenderingContext2D, w: number) => {
    const h = (w / MINIMAP_SIZE) * MINIMAP_SIZE;

    const visible = events.filter((e) => {
      if (e.px === null || e.py === null) return false;
      if (e.is_bot && !showBots) return false;
      if (!e.is_bot && !showHumans) return false;
      if (currentTime !== null && e.rel_ts !== undefined && e.rel_ts > currentTime) return false;
      return true;
    });

    drawTrails(ctx, visible);
    drawMarkers(ctx, visible);
  };

  const drawTrails = (ctx: CanvasRenderingContext2D, visible: GameEvent[]) => {
    const groups = new Map<string, GameEvent[]>();
    for (const e of visible) {
      if (!groups.has(e.user_id)) groups.set(e.user_id, []);
      groups.get(e.user_id)!.push(e);
    }

    let idx = 0;
    for (const [uid, grp] of groups) {
      const path = grp.filter(
        (e) => e.event === "Position" || e.event === "BotPosition"
      );
      if (path.length < 2) continue;

      const isSelected = selectedPlayerId === uid;
      const isHovered = hoveredPlayer === uid;
      const color = isSelected ? "#ffffff" : PLAYER_COLORS[idx % PLAYER_COLORS.length];
      const alpha = isSelected ? 1 : isHovered ? 0.8 : (uid.match(/^\d+$/) ? 0.25 : 0.45);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : (isHovered ? 2.5 : 1.5);
      ctx.globalAlpha = alpha;

      for (let i = 0; i < path.length; i++) {
        const { sx, sy } = worldToScreen(path[i].px!, path[i].py!);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (isSelected || isHovered) {
        const last = path[path.length - 1];
        const { sx, sy } = worldToScreen(last.px!, last.py!);
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(sx - 20, sy - 20, 40, 16);
        ctx.fillStyle = color;
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(uid.length > 8 ? uid.slice(0, 8) : uid, sx, sy - 12);
      }

      idx++;
    }
  };

  const drawMarkers = (ctx: CanvasRenderingContext2D, visible: GameEvent[]) => {
    for (const e of visible) {
      if (e.px === null || e.py === null) continue;
      const evt = e.event;
      if (evt === "Position" || evt === "BotPosition") continue;
      if (!showEventTypes.has(evt)) continue;

      const { sx, sy } = worldToScreen(e.px, e.py);
      const color = EVENT_COLORS[evt] || "#fff";
      const isHighlighted = highlightedEvent === e;
      const markerSize = isHighlighted ? 12 : 6;

      ctx.save();
      ctx.translate(sx, sy);

      if (isHighlighted) {
        ctx.beginPath();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        ctx.arc(0, 0, markerSize + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = isHighlighted ? 1 : 0.85;

      if (evt === "Kill" || evt === "BotKill") {
        ctx.strokeStyle = color;
        ctx.lineWidth = evt === "Kill" ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, markerSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-markerSize - 2, 0); ctx.lineTo(-2, 0);
        ctx.moveTo(2, 0); ctx.lineTo(markerSize + 2, 0);
        ctx.moveTo(0, -markerSize - 2); ctx.lineTo(0, -2);
        ctx.moveTo(0, 2); ctx.lineTo(0, markerSize + 2);
        ctx.stroke();
      } else if (evt === "Killed" || evt === "BotKilled") {
        ctx.fillStyle = color;
        ctx.font = `${markerSize * 2.5}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✕", 0, 1);
      } else if (evt === "KilledByStorm") {
        ctx.fillStyle = color;
        ctx.font = `${markerSize * 2.2}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚡", 0, 0);
      } else if (evt === "Loot") {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isHighlighted) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(-60, markerSize + 8, 120, 18);
        ctx.fillStyle = "#fff";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${evt} · ${e.user_id.slice(0, 8)}`, 0, markerSize + 17);
      }

      ctx.restore();
    }
  };

  useEffect(() => {
    drawAll();
    const onResize = () => drawAll();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawAll]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (onWorldCoordHover) {
      const { px, py } = screenToWorld(mx, my);
      const cfg = MAP_CONFIGS[mapId];
      if (cfg) {
        const u = px / MINIMAP_SIZE;
        const v = 1 - py / MINIMAP_SIZE;
        onWorldCoordHover(
          Math.round(u * cfg.scale + cfg.origin_x),
          Math.round(v * cfg.scale + cfg.origin_z)
        );
      }
    }

    for (const e of events) {
      if (e.px === null || e.py === null) continue;
      if (e.event !== "Position" && e.event !== "BotPosition") continue;
      const { sx, sy } = worldToScreen(e.px, e.py);
      const dx = mx - sx;
      const dy = my - sy;
      if (dx * dx + dy * dy < 100) {
        setHoveredPlayer(e.user_id);
        return;
      }
    }
    setHoveredPlayer(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const evt of events) {
      if (evt.px === null || evt.py === null) continue;
      if (evt.event === "Position" || evt.event === "BotPosition") continue;
      if (currentTime !== null && evt.rel_ts !== undefined && evt.rel_ts > currentTime) continue;
      const { sx, sy } = worldToScreen(evt.px, evt.py);
      const dx = mx - sx;
      const dy = my - sy;
      if (dx * dx + dy * dy < 100) {
        onEventClick(evt);
        return;
      }
    }

    for (const e of events) {
      if (e.px === null || e.py === null) continue;
      const { sx, sy } = worldToScreen(e.px, e.py);
      const dx = mx - sx;
      const dy = my - sy;
      if (dx * dx + dy * dy < 200) {
        onPlayerSelect(selectedPlayerId === e.user_id ? null : e.user_id);
        return;
      }
    }

    onEventClick(null);
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl bg-zinc-900" style={{ minHeight: 600 }}>
      <canvas
        ref={bgRef}
        className="absolute inset-0 w-full h-full object-contain"
      />
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full object-contain cursor-crosshair"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />

      {selectedPlayerId && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-2 rounded-lg border border-zinc-600 z-20">
          <div className="text-xs text-zinc-400">Following</div>
          <div className="text-sm text-white font-mono">
            {selectedPlayerId.slice(0, 12)}...
            <span className="text-zinc-500 ml-2">
              {selectedPlayerId.match(/^\d+$/) ? "🤖 Bot" : "👤 Human"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}