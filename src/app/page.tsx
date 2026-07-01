"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { GameEvent, MatchMeta, HeatmapData, HeatmapType } from "@/lib/types";
import { MAP_DISPLAY_NAMES } from "@/lib/types";
import { loadMatches, loadMatchData, loadHeatmaps } from "@/lib/dataLoader";
import MapCanvas from "@/components/MapCanvas";
import FilterBar from "@/components/FilterBar";
import MatchTimeline from "@/components/MatchTimeline";
import EventLegend from "@/components/EventLegend";
import HeatmapOverlay from "@/components/HeatmapOverlay";

export default function Home() {
  const [matches, setMatches] = useState<MatchMeta[]>([]);
  const [matchEventsCache, setMatchEventsCache] = useState<Map<string, GameEvent[]>>(new Map());
  const [heatmapData, setHeatmapData] = useState<Record<string, HeatmapData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMatch, setLoadingMatch] = useState(false);

  const [selectedMap, setSelectedMap] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [selectedMatchId, setSelectedMatchId] = useState("all");
  const [showHumans, setShowHumans] = useState(true);
  const [showBots, setShowBots] = useState(true);
  const [showEventTypes, setShowEventTypes] = useState<Set<string>>(
    new Set(["Kill", "Killed", "BotKill", "BotKilled", "KilledByStorm", "Loot", "Position", "BotPosition"])
  );
  const [heatmapType, setHeatmapType] = useState<HeatmapType | null>(null);
  const [hoveredCoord, setHoveredCoord] = useState<{ x: number; z: number } | null>(null);

  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [highlightedEvent, setHighlightedEvent] = useState<GameEvent | null>(null);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [m, h] = await Promise.all([loadMatches(), loadHeatmaps()]);
        setMatches(m);
        setHeatmapData(h);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load data:", err);
        setLoading(false);
      }
    }
    init();
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedMap !== "all" && m.map_id !== selectedMap) return false;
      if (selectedDate !== "all" && !m.dates.includes(selectedDate)) return false;
      return true;
    });
  }, [matches, selectedMap, selectedDate]);

  const currentMatchMeta = useMemo(() => {
    if (selectedMatchId === "all") return null;
    return matches.find((m) => m.match_id === selectedMatchId) || null;
  }, [matches, selectedMatchId]);

  const currentMapId = useMemo(() => {
    if (currentMatchMeta) return currentMatchMeta.map_id;
    if (selectedMap !== "all") return selectedMap;
    const counts: Record<string, number> = {};
    for (const m of filteredMatches) {
      counts[m.map_id] = (counts[m.map_id] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "AmbroseValley";
  }, [currentMatchMeta, selectedMap, filteredMatches]);

  const currentEvents: GameEvent[] = useMemo(() => {
    if (selectedMatchId === "all") return [];
    return matchEventsCache.get(selectedMatchId) || [];
  }, [selectedMatchId, matchEventsCache]);

  const matchDuration = useMemo(() => {
    if (currentEvents.length < 2) return 0;
    const relTsValues = currentEvents.map((e) => e.rel_ts ?? 0).filter((t) => t >= 0);
    if (relTsValues.length < 2) return 0;
    return Math.max(...relTsValues);
  }, [currentEvents]);

  const loadMatch = useCallback(async (matchId: string) => {
    if (matchId === "all" || matchEventsCache.has(matchId)) return;
    setLoadingMatch(true);
    try {
      const data = await loadMatchData(matchId);
      setMatchEventsCache((prev) => {
        const next = new Map(prev);
        next.set(matchId, data);
        return next;
      });
    } catch (err) {
      console.error("Failed to load match:", err);
    }
    setLoadingMatch(false);
  }, [matchEventsCache]);

  useEffect(() => {
    if (selectedMatchId !== "all" && !matchEventsCache.has(selectedMatchId)) {
      loadMatch(selectedMatchId);
    }
    setCurrentTime(null);
    setIsPlaying(false);
  }, [selectedMatchId, loadMatch, matchEventsCache]);

  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  useEffect(() => {
    if (isPlaying && matchDuration > 0) {
      const interval = 100 / playSpeed;
      playTimerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev === null) return 1;
          const next = prev + 1;
          if (next >= matchDuration) {
            setIsPlaying(false);
            return matchDuration;
          }
          return next;
        });
      }, interval);
    }
    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, matchDuration, playSpeed]);

  const handleResetView = useCallback(() => {
    setSelectedMap("all");
    setSelectedDate("all");
    setSelectedMatchId("all");
    setHeatmapType(null);
    setCurrentTime(null);
    setIsPlaying(false);
  }, []);

  const toggleEventType = useCallback((event: string) => {
    setShowEventTypes((prev) => {
      const next = new Set(prev);
      if (next.has(event)) next.delete(event);
      else next.add(event);
      return next;
    });
  }, []);

  const isSingleMatchView = selectedMatchId !== "all";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-400">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          Loading player data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              LILA BLACK — Player Journey Explorer
            </h1>
            <p className="text-xs text-zinc-500">
              {matches.length} matches &middot;{" "}
              {matches.reduce((s, m) => s + m.human_count + m.bot_count, 0)} players &middot;{" "}
              3 maps
            </p>
          </div>
          {hoveredCoord && (
            <div className="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1 rounded border border-zinc-700">
              World: ({hoveredCoord.x}, {hoveredCoord.z})
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <FilterBar
            matches={matches}
            selectedMap={selectedMap}
            selectedDate={selectedDate}
            selectedMatchId={selectedMatchId}
            showHumans={showHumans}
            showBots={showBots}
            showEventTypes={showEventTypes}
            onMapChange={setSelectedMap}
            onDateChange={setSelectedDate}
            onMatchChange={setSelectedMatchId}
            onHumansChange={setShowHumans}
            onBotsChange={setShowBots}
            onEventTypeToggle={toggleEventType}
            onResetView={handleResetView}
          />
        </motion.div>

        <MatchTimeline
          events={currentEvents}
          currentTime={currentTime}
          duration={matchDuration}
          playSpeed={playSpeed}
          onTimeChange={handleTimeChange}
          onPlayToggle={togglePlay}
          onSpeedChange={setPlaySpeed}
          isPlaying={isPlaying}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <div className="relative bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden" style={{ minHeight: 600 }}>
              <div className="absolute top-3 left-3 z-10 text-xs font-medium bg-black/60 backdrop-blur px-2.5 py-1.5 rounded-lg text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{MAP_DISPLAY_NAMES[currentMapId] || currentMapId}</span>
                {heatmapType && (
                  <span className="text-blue-400">· Heatmap: {heatmapType}</span>
                )}
                {!isSingleMatchView && (
                  <span className="text-amber-400/70">· Overview</span>
                )}
                {(isSingleMatchView && loadingMatch) && (
                  <span className="text-amber-400 animate-pulse">· Loading...</span>
                )}
              </div>
              <MapCanvas
                mapId={currentMapId}
                events={currentEvents}
                showHumans={showHumans}
                showBots={showBots}
                showEventTypes={showEventTypes}
                heatmapType={heatmapType}
                heatmapData={heatmapData?.[currentMapId] || null}
                currentTime={currentTime}
                selectedPlayerId={null}
                onPlayerSelect={() => {}}
                highlightedEvent={highlightedEvent}
                onEventClick={setHighlightedEvent}
                onWorldCoordHover={(x, z) =>
                  setHoveredCoord(x !== null && z !== null ? { x, z } : null)
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <EventLegend
                showEventTypes={showEventTypes}
                onEventTypeToggle={toggleEventType}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <HeatmapOverlay
                heatmapType={heatmapType}
                onHeatmapChange={setHeatmapType}
              />
            </motion.div>
            <AnimatePresence>
              {isSingleMatchView && currentMatchMeta && (
                <motion.div
                  key="match-info"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg"
                >
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Match Info
                  </h3>
                  <div className="text-xs text-zinc-300 space-y-1">
                    <div>
                      <span className="text-zinc-500">Match:</span>{" "}
                      {currentMatchMeta.match_id.slice(0, 8)}...
                    </div>
                    <div>
                      <span className="text-zinc-500">Map:</span>{" "}
                      {MAP_DISPLAY_NAMES[currentMatchMeta.map_id]}
                    </div>
                    <div>
                      <span className="text-zinc-500">Players:</span>{" "}
                      {currentMatchMeta.human_count} human · {currentMatchMeta.bot_count} bot
                    </div>
                    <div>
                      <span className="text-zinc-500">Date:</span>{" "}
                      {currentMatchMeta.dates.join(", ").replace(/_/g, " ")}
                    </div>
                    <div>
                      <span className="text-zinc-500">Events:</span>{" "}
                      {currentEvents.length}
                    </div>
                    <div>
                      <span className="text-zinc-500">Duration:</span>{" "}
                      {matchDuration > 0
                        ? `${Math.floor(matchDuration / 60000)}m ${Math.floor(
                            (matchDuration % 60000) / 1000
                          )}s`
                        : "?"}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!isSingleMatchView && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg"
                >
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    View Mode: Overview
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Showing aggregate data across{" "}
                    {filteredMatches.length} matches. Select a specific match to see
                    individual player paths and timeline playback.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
