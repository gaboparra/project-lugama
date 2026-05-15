const STATS = (user, attempt) => [
  { label: 'Usuario',     value: user?.username    ?? '—',  accent: false },
  { label: 'Puntos',      value: user?.points      ?? 0,    accent: true  },
  { label: 'Estrellas⭐', value: user?.stars       ?? 0,    accent: true  },
  { label: 'Intento',     value: `${attempt} / 6`,          accent: true  },
]

export default function StatsBar({ user, attempt }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {STATS(user, attempt).map(({ label, value, accent }) => (
        <div key={label} className="card rounded-xl p-3 flex flex-col items-center gap-1">
          <span className="text-muted text-xs uppercase tracking-wide">{label}</span>
          <strong className={`text-base font-bold ${accent ? 'text-purple-h' : 'text-white-custom'}`}
            style={{ fontFamily: 'Syne' }}>
            {value}
          </strong>
        </div>
      ))}
    </div>
  )
}