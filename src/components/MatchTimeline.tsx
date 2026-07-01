"use client";

interface MatchTimelineProps {
  events: { rel_ts?: number; event: string }[];
  currentTime: number | null;
  duration: number;
  playSpeed: number;
  onTimeChange: (time: number) => void;
  onPlayToggle: () => void;
  onSpeedChange: (speed: number) => void;
  isPlaying: boolean;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function MatchTimeline({
  events,
  currentTime,
  duration,
  playSpeed,
  onTimeChange,
  onPlayToggle,
  onSpeedChange,
  isPlaying,
}: MatchTimelineProps) {
  const hasData = events && events.length > 0 && duration > 0;
  const progress =
    currentTime !== null && duration > 0
      ? (currentTime / duration) * 100
      : 0;

  const visibleCount =
    currentTime !== null && hasData
      ? events.filter(
          (e) => e.rel_ts !== undefined && e.rel_ts <= currentTime
        ).length
      : 0;
  const totalCount = events.length;

  const SPEEDS = [0.5, 1, 2, 5];

  if (!hasData) {
    return (
      <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-500 text-sm text-center">
        Select a specific match to view timeline
      </div>
    );
  }

  function handleBarClick(e: React.MouseEvent) {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    onTimeChange(pct * duration);
  }

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onPlayToggle}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            isPlaying
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>

        <span className="text-zinc-300 text-xs font-mono min-w-[80px]">
          {formatTime(currentTime || 0)}
          <span className="text-zinc-600"> / {formatTime(duration)}</span>
        </span>

        <div className="flex items-center gap-1 ml-2">
          <span className="text-zinc-500 text-xs">Speed:</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`text-xs px-1.5 py-0.5 rounded ${
                playSpeed === s
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <span className="text-zinc-500 text-xs ml-auto">
          {visibleCount}/{totalCount} events
        </span>
      </div>

      <div className="relative">
        <div
          className="relative h-3 bg-zinc-700 rounded-full overflow-hidden cursor-pointer group"
          onClick={handleBarClick}
        >
          <div
            className="absolute h-full rounded-full transition-none"
            style={{
              width: `${progress}%`,
              background: isPlaying
                ? "linear-gradient(90deg, #3b82f6, #8b5cf6)"
                : "linear-gradient(90deg, #3b82f6, #60a5fa)",
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>
      </div>
    </div>
  );
}
