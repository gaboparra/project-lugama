export default function GenreSelector({ genres, selected, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <label style={{ color: 'var(--white)' }} className="text-sm font-medium whitespace-nowrap">
        Género:
      </label>
      <select value={selected} onChange={(e) => onChange(e.target.value)}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--white)' }}
        className="flex-1 rounded-xl px-3 py-2 text-sm outline-none cursor-pointer">
        <option value="">Aleatorio</option>
        {genres.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
    </div>
  )
}