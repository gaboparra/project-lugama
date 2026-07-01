import { useState, useRef, useEffect } from "react";
import {Play, Pause, Volume2, Volume1, VolumeX } from 'lucide-react'
import Dots from "./Dots";

const PlayIcon   = () => <Play  size={18} fill="white" stroke="none" />
const PauseIcon  = () => <Pause size={18} fill="white" stroke="none" />
 
const VolumeIcon = ({ level }) => {
  if (level === 0)  return <VolumeX size={16} />
  if (level < 0.5)  return <Volume1 size={16} />
  return                   <Volume2 size={16} />
}

export default function Player({
  attempt,
  feedback,
  isPlaying,
  currentTime,
  volume,
  gameOver,
  TIME_LIMITS,
  MAX_ATTEMPTS,
  onTogglePlay,
  onVolumeChange,
}) {
  const [showVolume, setShowVolume] = useState(false);
  const volRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (volRef.current && !volRef.current.contains(e.target))
        setShowVolume(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const time = currentTime ?? 0;
  const totalTime = TIME_LIMITS[MAX_ATTEMPTS];
  const indicatorPct = Math.min(time / totalTime, 1) * 100;

  const segStart = TIME_LIMITS[attempt - 1] || 0;
  const segDur = TIME_LIMITS[attempt] - segStart;
  const segFill = Math.min(Math.max((time - segStart) / segDur, 0), 1) * 100;

  const segments = Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
    const from = TIME_LIMITS[i] || 0;
    const to = TIME_LIMITS[i + 1];
    const dur = to !== undefined ? to - from : totalTime - from;
    return { id: i + 1, widthPct: (dur / totalTime) * 100 };
  });

  const feedbackClass =
    feedback.type === "correct"
      ? "text-success"
      : feedback.type === "wrong"
        ? "text-error-feedback"
        : "text-muted";

  return (
    <div className="card flex flex-col gap-3">
      <Dots current={attempt} max={MAX_ATTEMPTS} gameOver={gameOver} />

      <div className="flex items-center justify-between">
        <span className="badge-time">
          {gameOver ? "30s" : `${TIME_LIMITS[attempt]}s`}
        </span>
        <span className="text-muted text-xs tabular-nums">
          {time.toFixed(1)}s
        </span>
      </div>

      <div className="relative flex items-center gap-1" style={{ height: 28 }}>
        <div className="bar-indicator" style={{ left: `${indicatorPct}%` }} />

        {segments.map(({ id, widthPct }) => {
          const state = gameOver
            ? "done"
            : id < attempt
              ? "done"
              : id === attempt
                ? "active"
                : "idle";

          return (
            <div
              key={id}
              className={`relative flex-shrink-0 seg-${state}`}
              style={{
                flexBasis: `${widthPct}%`,
                height: 10,
                borderRadius: 5,
                overflow: "hidden",
              }}
            >
              {state === "active" && (
                <div
                  className="seg-fill-bar absolute inset-0"
                  style={{ width: `${segFill}%`, borderRadius: 5 }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-play" onClick={onTogglePlay}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div ref={volRef} className="flex items-center">
          <button
            className="btn-volume"
            onClick={() => setShowVolume((v) => !v)}
          >
            <VolumeIcon level={volume} />
          </button>
          <div
            className="flex items-center overflow-hidden"
            style={{
              width: showVolume ? 110 : 0,
              transition: "width 0.25s ease",
            }}
          >
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="h-1 cursor-pointer"
              style={{
                accentColor: "var(--purple)",
                width: 94,
                margin: "0 8px",
              }}
            />
          </div>
        </div>
      </div>

      <p className={`text-xs font-medium min-h-4 ${feedbackClass}`}>
        {feedback.msg}
      </p>
    </div>
  );
}
