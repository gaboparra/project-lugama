export default function GenreSelector({ genres, selected, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium whitespace-nowrap text-white-custom">
        Género:
      </label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="input-base flex-1 py-2 cursor-pointer"
      >
        <option value="">Aleatorio</option>
        {genres.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
    </div>
  )
}