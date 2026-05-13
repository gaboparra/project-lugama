import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import useGame from "../hooks/useGame";
import StatsBar from "../components/StatsBar";
import Player from "../components/Player";
import GenreSelector from "../components/GenreSelector";
import SongReveal from "../components/SongReveal";
import InstructionsModal from "../components/InstructionsModal";
import logo from "../assets/img/lgm-icon-removebg-preview.png";

export default function GamePage() {
  const { user, logout, updateUser } = useAuth();
  const [localUser, setLocalUser] = useState(user);
  const [guess, setGuess] = useState("");

  const onUserUpdate = useCallback((updates) => {
    setLocalUser((u) => ({ ...u, ...updates }));
  }, []);

  const {
    song,
    attempt,
    genres,
    feedback,
    revealedSong,
    guessDisabled,
    suggestions,
    isPlaying,
    currentTime,
    volume,
    audioRef,
    TIME_LIMITS,
    MAX_ATTEMPTS,
    loadGenres,
    loadSong,
    changeGenre,
    check,
    skip,
    search,
    genre,
    togglePlay,
    changeVolume,
  } = useGame(onUserUpdate);

  useEffect(() => {
    loadGenres();
    loadSong();
  }, []);

  const handleCheck = () => {
    check(guess);
    setGuess("");
  };
  const handleSkip = () => {
    skip();
    setGuess("");
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCheck();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header fijo */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
        style={{
          background: "rgba(15,15,17,0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <img src={logo} alt="Lugama" className="h-10" />
        <div className="flex items-center gap-3">
          <InstructionsModal />
          <button
            onClick={logout}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--white)",
            }}
            className="px-4 py-1.5 rounded-xl text-sm hover:border-purple-500 transition-colors w-auto"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 flex justify-center pt-24 pb-12 px-4">
        <div className="w-full max-w-xl flex flex-col gap-4">
          <StatsBar user={localUser} attempt={attempt} />

          <GenreSelector
            genres={genres}
            selected={genre}
            onChange={changeGenre}
          />

 

          <Player
            song={song}
            audioRef={audioRef}
            attempt={attempt}
            feedback={feedback}
            isPlaying={isPlaying}
            currentTime={currentTime ?? 0}
            volume={volume}
            TIME_LIMITS={TIME_LIMITS}
            MAX_ATTEMPTS={MAX_ATTEMPTS}
            onTogglePlay={togglePlay}
            onVolumeChange={changeVolume}
          />

          {revealedSong && <SongReveal song={revealedSong} />}

          <div className="flex flex-col gap-2">
            <input
              value={guess}
              onChange={(e) => {
                setGuess(e.target.value);
                search(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              disabled={guessDisabled}
              placeholder="¿Qué canción es?"
              list="songs-list"
              style={{
                background: "var(--surface)",
                border: "1.5px solid var(--border)",
                color: "var(--white)",
              }}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-gray-500 disabled:opacity-40"
            />
            <datalist id="songs-list">
              {suggestions.map((s) => (
                <option key={s._id} value={s.title}>
                  {s.artist}
                </option>
              ))}
            </datalist>

            <button
              onClick={handleCheck}
              disabled={guessDisabled}
              style={{ background: "var(--purple)" }}
              className="w-full py-3 rounded-xl text-white text-sm font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
            >
              Adivinar
            </button>
            <button
              onClick={handleSkip}
              disabled={guessDisabled}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--white)",
              }}
              className="w-full py-3 rounded-xl text-sm font-medium hover:border-purple-500 transition-colors disabled:opacity-40"
            >
              Skip
            </button>
            <button
              onClick={() => {
                loadSong();
                setGuess("");
              }}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--white)",
              }}
              className="w-full py-3 rounded-xl text-sm font-medium hover:border-purple-500 transition-colors"
            >
              Saltar canción
            </button>
          </div>
        </div>
        <audio ref={audioRef} preload="auto" style={{ display: "none" }} />
      </main>

      <footer
        className="fixed bottom-0 left-0 right-0 text-center py-2 text-xs pointer-events-none"
        style={{ color: "var(--white)", opacity: 0.5 }}
      >
        © Lugama. Todos los derechos reservados.
      </footer>
    </div>
  );
}
