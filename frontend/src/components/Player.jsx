import { useState, useRef, useEffect } from 'react'
import Dots from './Dots'

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width={18} height={18}>
    <path d="M6 3l14 9-14 9V3z" />
  </svg>
)

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width={18} height={18}>
    <rect x="5" y="3" width="4" height="18" rx="1" />
    <rect x="15" y="3" width="4" height="18" rx="1" />
  </svg>
)

const VolumeIcon = ({ level }) => {
  if (level === 0) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
  if (level < 0.5) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

export default function Player({
  audioRef, attempt, feedback,
  isPlaying, currentTime, volume, gameOver,
  TIME_LIMITS, MAX_ATTEMPTS,
  onTogglePlay, onVolumeChange,
}) {
  const [showVolume, setShowVolume] = useState(false)
  const volRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (volRef.current && !volRef.current.contains(e.target)) setShowVolume(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const time         = currentTime ?? 0
  const totalTime    = TIME_LIMITS[MAX_ATTEMPTS]
  const indicatorPct = Math.min(time / totalTime, 1) * 100

  const segStart = TIME_LIMITS[attempt - 1] || 0
  const segDur   = TIME_LIMITS[attempt] - segStart
  const segFill  = Math.min(Math.max((time - segStart) / segDur, 0), 1) * 100

  // Fix 6to segmento: si TIME_LIMITS[i+1] no existe, va hasta el total
  const segments = Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
    const from = TIME_LIMITS[i] || 0
    const to   = TIME_LIMITS[i + 1]
    const dur  = to !== undefined ? to - from : totalTime - from
    return { id: i + 1, widthPct: (dur / totalTime) * 100 }
  })

  const feedbackClass =
    feedback.type === 'correct' ? 'text-success' :
    feedback.type === 'wrong'   ? 'text-error-feedback' : 'text-muted'

  return (
    <div className="card flex flex-col gap-3">

      <Dots current={attempt} max={MAX_ATTEMPTS} gameOver={gameOver} />

      <div className="flex items-center justify-between">
        <span className="badge-time">
          {gameOver ? '30s' : `${TIME_LIMITS[attempt]}s`}
        </span>
        <span className="text-muted text-xs tabular-nums">{time.toFixed(1)}s</span>
      </div>

      {/* Barra de segmentos */}
      <div className="relative flex items-center gap-1" style={{ height: 28 }}>
        <div className="bar-indicator" style={{ left: `${indicatorPct}%` }} />

        {segments.map(({ id, widthPct }) => {
          const state = gameOver
            ? 'done'
            : id < attempt ? 'done' : id === attempt ? 'active' : 'idle'

          return (
            <div
              key={id}
              className={`relative flex-shrink-0 seg-${state}`}
              style={{ flexBasis: `${widthPct}%`, height: 10, borderRadius: 5, overflow: 'hidden' }}
            >
              {state === 'active' && (
                <div
                  className="seg-fill-bar absolute inset-0"
                  style={{ width: `${segFill}%`, borderRadius: 5 }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3">
        <button className="btn-play" onClick={onTogglePlay}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div ref={volRef} className="flex items-center">
          <button className="btn-volume" onClick={() => setShowVolume(v => !v)}>
            <VolumeIcon level={volume} />
          </button>
          <div
            className="flex items-center overflow-hidden"
            style={{ width: showVolume ? 110 : 0, transition: 'width 0.25s ease' }}
          >
            <input
              type="range" min={0} max={1} step={0.01} value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="h-1 cursor-pointer"
              style={{ accentColor: 'var(--purple)', width: 94, margin: '0 8px' }}
            />
          </div>
        </div>
      </div>

      <p className={`text-xs font-medium min-h-4 ${feedbackClass}`}>{feedback.msg}</p>
    </div>
  )
}