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
  const { user, logout } = useAuth();

  const [localUser, setLocalUser] = useState(user);
  const [guess, setGuess] = useState("");

  const onUserUpdate = useCallback((updates) => {
    setLocalUser((u) => ({ ...u, ...updates }));
  }, []);

  const {
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
    difficulty,
    changeDifficulty,
    gameOver,
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

  const handleNewSong = () => {
    loadSong();
    setGuess("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCheck();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="site-header">
        <img src={logo} alt="Lugama" className="h-10" />

        <div className="flex items-center gap-3">
          <InstructionsModal />

          <button className="btn-header" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="flex-1 flex justify-center pt-24 pb-12 px-4">
        <div className="w-full max-w-xl flex flex-col gap-4">
          <StatsBar user={localUser} attempt={attempt} />

          <GenreSelector
            genres={genres}
            selected={genre}
            onChange={changeGenre}
            difficulty={difficulty}
            onDifficultyChange={changeDifficulty}
          />

          <Player
            audioRef={audioRef}
            attempt={attempt}
            feedback={feedback}
            isPlaying={isPlaying}
            currentTime={currentTime ?? 0}
            volume={volume}
            gameOver={gameOver}
            TIME_LIMITS={TIME_LIMITS}
            MAX_ATTEMPTS={MAX_ATTEMPTS}
            onTogglePlay={togglePlay}
            onVolumeChange={changeVolume}
          />

          {revealedSong && <SongReveal song={revealedSong} />}

          <div className="flex flex-col gap-2">
            <input
              className="input-base"
              value={guess}
              onChange={(e) => {
                setGuess(e.target.value);
                search(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              disabled={guessDisabled}
              placeholder="¿Qué canción es?"
              list="songs-list"
            />

            <datalist id="songs-list">
              {suggestions.map((s) => (
                <option key={s._id} value={s.title}>
                  {s.artist}
                </option>
              ))}
            </datalist>

            <button
              className="btn btn-primary"
              onClick={handleCheck}
              disabled={guessDisabled}
            >
              Adivinar
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleSkip}
              disabled={guessDisabled}
            >
              Skip
            </button>

            <button className="btn btn-secondary" onClick={handleNewSong}>
              Saltar canción
            </button>
          </div>
        </div>

        <audio ref={audioRef} preload="auto" style={{ display: "none" }} />
      </main>

      <footer className="site-footer">
        © Lugama. Todos los derechos reservados.
      </footer>
    </div>
  );
}
