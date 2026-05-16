export default function SongReveal({ song }) {
  if (!song) return null;
  return (
    <div className="card rounded-2xl flex items-center gap-4">
      <img
        src={song.albumCover}
        alt="Portada"
        className="rounded-xl object-cover flex-shrink-0"
        style={{ width: 72, height: 72 }}
      />
      <p
        className="font-bold text-sm text-white-custom"
        style={{ fontFamily: "Syne" }}
      >
        {song.title} — {song.artist}
      </p>
    </div>
  );
}
