export default function StatsBar({ user, attempt }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: 'Usuario',    value: user?.username,       accent: false },
        { label: 'Puntos',     value: user?.points ?? 0,    accent: true  },
        { label: 'Estrellas⭐', value: user?.stars ?? 0,    accent: true  },
        { label: 'Intento',    value: `${attempt} / 6`,     accent: true  },
      ].map(({ label, value, accent }) => (
        <div key={label}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          className="rounded-xl p-3 flex flex-col items-center gap-1">
          <span style={{ color: 'var(--muted)' }} className="text-xs uppercase tracking-wide">{label}</span>
          <strong style={{ fontFamily: 'Syne', color: accent ? 'var(--purple-h)' : 'var(--white)' }}
            className="text-base">{value}</strong>
        </div>
      ))}
    </div>
  )
}