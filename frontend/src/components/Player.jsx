import { useState, useRef, useEffect } from 'react'
import Dots from './Dots'

const VolumeIcon = ({ v }) => {
  if (v === 0) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
  if (v < 0.5) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

export default function Player({
  audioRef, attempt, feedback,
  isPlaying, currentTime, volume,
  TIME_LIMITS, MAX_ATTEMPTS,
  onTogglePlay, onVolumeChange,
}) {
  const [showVolume, setShowVolume] = useState(false)
  const volRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (volRef.current && !volRef.current.contains(e.target)) setShowVolume(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const totalTime    = TIME_LIMITS[MAX_ATTEMPTS]
  const indicatorPct = Math.min((currentTime ?? 0) / totalTime, 1) * 100

  const segStart = TIME_LIMITS[attempt - 1] || 0
  const segDur   = TIME_LIMITS[attempt] - segStart
  const segFill = Math.min(Math.max(((currentTime ?? 0) - segStart) / segDur, 0), 1) * 100

  const segments = Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
    const prev = TIME_LIMITS[i] || 0
    const dur  = TIME_LIMITS[i + 1] - prev
    return { id: i + 1, width: (dur / totalTime) * 100 }
  })

  const feedbackColor =
    feedback.type === 'correct' ? '#3ecf7a' :
    feedback.type === 'wrong'   ? '#cf7a7a' : 'var(--muted)'

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      className="rounded-2xl p-5 flex flex-col gap-3">

      <Dots current={attempt} max={MAX_ATTEMPTS} />

      <div className="flex items-center justify-between">
        <span style={{ background: 'var(--purple)', color: '#fff' }}
          className="px-3 py-0.5 rounded-full text-xs font-semibold">
          {TIME_LIMITS[attempt]}s
        </span>
        <span style={{ color: 'var(--muted)' }} className="text-xs tabular-nums">
          {(currentTime ?? 0).toFixed(1)}s
        </span>
      </div>

      {/* Barra */}
      <div className="relative flex items-center gap-1" style={{ height: 28 }}>
        <div className="absolute pointer-events-none" style={{
          top: -8, left: `${indicatorPct}%`,
          transform: 'translateX(-50%)', zIndex: 10,
          width: 0, height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '7px solid var(--white)',
        }} />
        {segments.map(({ id, width }) => {
          const state = id < attempt ? 'done' : id === attempt ? 'active' : ''
          return (
            <div key={id} className="relative flex-shrink-0"
              style={{
                flexBasis: `${width}%`, height: 10, borderRadius: 5,
                overflow: 'hidden',
                background:
                  state === 'done'   ? 'var(--purple)' :
                  state === 'active' ? 'var(--surface2)' : 'var(--border)',
                border: state === 'active' ? '1px solid var(--border)' : 'none',
              }}>
              {state === 'active' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  width: `${segFill}%`,
                  background: 'var(--purple-h)',
                  borderRadius: 5,
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3">
        <button onClick={onTogglePlay}
          style={{ background: 'var(--purple)', width: 46, height: 46, borderRadius: '50%', flexShrink: 0 }}
          className="flex items-center justify-center hover:opacity-90 active:scale-95 transition-all border-none cursor-pointer">
          {isPlaying
            ? <svg viewBox="0 0 24 24" fill="white" width={18} height={18}>
                <rect x="5" y="3" width="4" height="18" /><rect x="15" y="3" width="4" height="18" />
              </svg>
            : <svg viewBox="0 0 24 24" fill="white" width={18} height={18}>
                <polygon points="6,3 20,12 6,21" />
              </svg>
          }
        </button>

        <div ref={volRef} className="flex items-center">
          <button onClick={() => setShowVolume(v => !v)}
            style={{ color: 'var(--muted)', background: 'transparent', border: 'none', width: 'auto', padding: 6 }}
            className="cursor-pointer flex items-center justify-center hover:opacity-80 transition-opacity">
            <VolumeIcon v={volume} />
          </button>
          <div style={{ width: showVolume ? 110 : 0, overflow: 'hidden', transition: 'width 0.25s ease' }}
            className="flex items-center">
            <input type="range" min={0} max={1} step={0.01} value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              style={{ accentColor: 'var(--purple)', width: 94, margin: '0 8px' }}
              className="h-1 cursor-pointer"
            />
          </div>
        </div>
      </div>


      <p className="text-xs font-medium min-h-4" style={{ color: feedbackColor }}>
        {feedback.msg}
      </p>
    </div>
  )
}