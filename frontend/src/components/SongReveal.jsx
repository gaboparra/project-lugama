export default function SongReveal({ song }) {
  if (!song) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      className="rounded-2xl p-4 flex items-center gap-4">
      <img src={song.albumCover} alt="Portada"
        className="w-18 h-18 rounded-xl object-cover flex-shrink-0" style={{ width: 72, height: 72 }} />
      <p style={{ fontFamily: 'Syne', color: 'var(--white)' }} className="font-bold text-sm">
        {song.title} — {song.artist}
      </p>
    </div>
  )
}