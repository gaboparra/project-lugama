export default function Dots({ current, max = 6, gameOver = false }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }, (_, i) => {
        const state = gameOver
          ? "done"
          : i < current - 1
            ? "done"
            : i === current - 1
              ? "active"
              : "idle";
        return (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 seg-${state}`}
          />
        );
      })}
    </div>
  );
}
