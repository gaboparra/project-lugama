const DIFFICULTIES = [
  { value: null, label: "Todas" },
  { value: 1, label: "Fácil" },
  { value: 2, label: "Intermedio" },
  { value: 3, label: "Difícil" },
  { value: 4, label: "Extremo" },
];

export default function GenreSelector({
  genres,
  selected,
  onChange,
  difficulty,
  onDifficultyChange,
}) {
  return (
    <div className="flex flex-col gap-3">
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

          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium whitespace-nowrap text-white-custom">
          Dificultad:
        </span>

        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map(({ value, label }) => {
            const isActive = difficulty === value;

            return (
              <button
                key={label}
                type="button"
                onClick={() => onDifficultyChange(value)}
                className="rounded-xl px-3 py-1.5 text-sm cursor-pointer"
                style={{
                  background: isActive ? "var(--primary)" : "var(--surface)",
                  border: `1px solid ${
                    isActive ? "var(--primary)" : "var(--border)"
                  }`,
                  color: "var(--white)",
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
