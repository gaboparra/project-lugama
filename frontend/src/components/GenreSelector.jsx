const DIFFICULTIES = [
  { value: null, label: 'Todas'      },
  { value: 1,    label: 'Fácil'      },
  { value: 2,    label: 'Intermedio' },
  { value: 3,    label: 'Difícil'    },
  { value: 4,    label: 'Extremo'    },
]

export default function GenreSelector({
  genres, selected, onChange,
  artists, selectedArtist, onArtistChange,
  difficulty, onDifficultyChange,
}) {
  return (
    <div className="flex flex-col gap-3">

      <div className="flex gap-3">
        <div className="flex items-center gap-2 flex-1">
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

        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm font-medium whitespace-nowrap text-white-custom">
            Artista:
          </label>
          <select
            value={selectedArtist}
            onChange={(e) => onArtistChange(e.target.value)}
            className="input-base flex-1 py-2 cursor-pointer"
          >
            <option value="">Todos</option>
            {(artists ?? []).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium whitespace-nowrap text-white-custom">
          Dificultad:
        </span>
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map(({ value, label }) => {
            const isActive = difficulty === value
            return (
              <button
                key={label}
                type="button"
                onClick={() => onDifficultyChange(value)}
                className="rounded-xl px-3 py-1.5 text-sm cursor-pointer transition-all"
                style={{
                  background: isActive ? 'var(--purple)' : 'var(--surface)',
                  border: `1px solid ${isActive ? 'var(--purple)' : 'var(--border)'}`,
                  color: 'var(--white)',
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}