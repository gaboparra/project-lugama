import { useEffect, useRef, useState, useCallback } from "react";
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
    artist,
    artists,
    loadArtists,
    changeArtist,
  } = useGame(onUserUpdate);

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadGenres();
    loadArtists();
    loadSong();
  }, []);

  // Cerrar dropdown al clickear fuera
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCheck = () => {
    check(guess);
    setGuess("");
    setShowDropdown(false);
  };

  const handleSkip = () => {
    skip();
    setGuess("");
    setShowDropdown(false);
  };

  const handleNewSong = () => {
    loadSong();
    setGuess("");
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCheck();
    if (e.key === "Escape") setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setGuess(val);
    search(val);
    setShowDropdown(val.length >= 2);
  };

  const handleSuggestionClick = (title) => {
    setGuess(title);
    setShowDropdown(false);
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

      <main className="flex-1 flex justify-center pt-24 pb-20 px-4 sm:pb-16 md:pb-12 md:items-center">
        <div className="w-full max-w-xl flex flex-col gap-4">
          <StatsBar user={localUser} attempt={attempt} />

          <GenreSelector
            genres={genres}
            selected={genre}
            onChange={changeGenre}
            artists={artists}
            selectedArtist={artist}
            onArtistChange={changeArtist}
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
            {/* Dropdown custom — reemplaza el datalist nativo */}
            <div className="relative" ref={dropdownRef}>
              <input
                className="input-base"
                value={guess}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => guess.length >= 2 && setShowDropdown(true)}
                disabled={guessDisabled}
                placeholder="¿Qué canción es?"
                autoComplete="off"
              />

              {showDropdown && suggestions.length > 0 && (
                <ul
                  className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {suggestions.map((s) => (
                    <li
                      key={s._id}
                      onMouseDown={() => handleSuggestionClick(s.title)}
                      className="px-4 py-2.5 cursor-pointer flex flex-col gap-0.5"
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--surface2)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--white)" }}
                      >
                        {s.title}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {s.artist}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
