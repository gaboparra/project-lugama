import { useState, useRef, useCallback } from "react";
import {
  getRandomSong,
  validateAnswer,
  searchSongs,
  getGenres,
  getArtists,
} from "../api/songs";

export const TIME_LIMITS = { 1: 0.5, 2: 1, 3: 2, 4: 5, 5: 10, 6: 30 };
export const MAX_ATTEMPTS = 6;

export default function useGame(onUserUpdate) {
  const [song, setSong] = useState(null);
  const [attempt, setAttempt] = useState(1);
  const [genre, setGenre] = useState("");
  const [genres, setGenres] = useState([]);
  const [artist, setArtist] = useState("");
  const [artists, setArtists] = useState([]);
  const [difficulty, setDifficulty] = useState(null);
  const [feedback, setFeedback] = useState({
    msg: "¡Dale Play para empezar!",
    type: "neutral",
  });
  const [revealedSong, setRevealed] = useState(null);
  const [guessDisabled, setGuessDisabled] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.25);
  const [gameOver, setGameOver] = useState(false);

  const audioRef = useRef(null);
  const frameRef = useRef(null);
  const attemptRef = useRef(1);
  const gameOverRef = useRef(false);
  const genreRef = useRef("");
  const artistRef = useRef("");
  const difficultyRef = useRef(null);

  // ── Audio ─────────────────────────────────────────────────────────────────
  const stopAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    cancelAnimationFrame(frameRef.current);
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const animate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = audio.currentTime;
    const limit = TIME_LIMITS[attemptRef.current];
    setCurrentTime(time);
    if (time >= limit) {
      stopAudio();
      return;
    }
    frameRef.current = requestAnimationFrame(animate);
  };

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio?.src) return;
    if (audio.paused) {
      audio.volume = volume;
      audio.play();
      setIsPlaying(true);
      if (!gameOverRef.current)
        frameRef.current = requestAnimationFrame(animate);
    } else {
      audio.pause();
      cancelAnimationFrame(frameRef.current);
      setIsPlaying(false);
    }
  }, [volume]);

  const changeVolume = (v) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  // ── Game ──────────────────────────────────────────────────────────────────
  const loadGenres = useCallback(async () => {
    try {
      setGenres(await getGenres());
    } catch {}
  }, []);

  const loadArtists = useCallback(async () => {
    try {
      setArtists(await getArtists());
    } catch {}
  }, []);

  const loadSong = useCallback(async (g, d, a) => {
    const selectedGenre = g !== undefined ? g : genreRef.current;
    const selectedDifficulty = d !== undefined ? d : difficultyRef.current;
    const selectedArtist = a !== undefined ? a : artistRef.current;

    stopAudio();
    setRevealed(null);
    setGuessDisabled(false);
    setGameOver(false);
    gameOverRef.current = false;
    setSuggestions([]);
    setFeedback({ msg: "¡Dale Play para empezar!", type: "neutral" });
    attemptRef.current = 1;
    setAttempt(1);

    // Limpiamos la canción/audio actual ANTES del fetch para no dejar
    // pegada la canción anterior si el request nuevo falla o tarda.
    setSong(null);
    if (audioRef.current) audioRef.current.removeAttribute("src");

    try {
      const data = await getRandomSong(
        selectedGenre,
        selectedDifficulty,
        selectedArtist,
      );
      setSong(data);
      if (audioRef.current) {
        audioRef.current.src = data.previewUrl;
        audioRef.current.load();
      }
    } catch (e) {
      const msg =
        e.response?.status === 404
          ? "No hay canciones con esos filtros, probá otra combinación"
          : "Error al cargar la canción";
      setFeedback({ msg, type: "wrong" });
      console.error(e);
    }
  }, []);

  const changeGenre = useCallback(
    (g) => {
      genreRef.current = g;
      artistRef.current = "";
      setGenre(g);
      setArtist("");
      loadSong(g, difficultyRef.current, "");
    },
    [loadSong],
  );

  const changeDifficulty = useCallback(
    (d) => {
      difficultyRef.current = d;
      setDifficulty(d);
      loadSong(genreRef.current, d, artistRef.current);
    },
    [loadSong],
  );

  const changeArtist = useCallback(
    (a) => {
      artistRef.current = a;
      genreRef.current = "";
      setArtist(a);
      setGenre("");
      loadSong("", difficultyRef.current, a);
    },
    [loadSong],
  );

  const advanceAttempt = (newAttempt) => {
    stopAudio();
    attemptRef.current = newAttempt;
    setAttempt(newAttempt);
  };

  const check = useCallback(
    async (answer) => {
      if (!song || !answer.trim()) return;
      try {
        const data = await validateAnswer(song._id, answer, attemptRef.current);
        if (data.correct) {
          const star = data.starEarned ? " ⭐ ¡ESTRELLA!" : "";
          setFeedback({
            msg: `¡Correcto! +${data.pointsEarned} pts.${star}`,
            type: "correct",
          });
          setRevealed(data.fullData);
          setGuessDisabled(true);
          setGameOver(true);
          gameOverRef.current = true;
          onUserUpdate({ points: data.totalPoints, stars: data.totalStars });
        } else if (attemptRef.current >= MAX_ATTEMPTS) {
          setFeedback({ msg: "Game Over.", type: "wrong" });
          setRevealed(data.fullData);
          setGuessDisabled(true);
          setGameOver(true);
          gameOverRef.current = true;
        } else {
          advanceAttempt(attemptRef.current + 1);
          setFeedback({ msg: "Incorrecto.", type: "wrong" });
        }
      } catch (e) {
        console.error(e);
      }
    },
    [song, onUserUpdate],
  );

  const skip = useCallback(() => {
    if (guessDisabled) return;
    if (attemptRef.current >= MAX_ATTEMPTS) return;
    advanceAttempt(attemptRef.current + 1);
    setFeedback({ msg: "Intento saltado.", type: "neutral" });
  }, [guessDisabled]);

  const search = useCallback(async (q) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      setSuggestions(await searchSongs(q));
    } catch {}
  }, []);

  return {
    song,
    attempt,
    genre,
    genres,
    artist,
    artists,
    difficulty,
    feedback,
    revealedSong,
    guessDisabled,
    suggestions,
    isPlaying,
    currentTime,
    volume,
    gameOver,
    audioRef,
    TIME_LIMITS,
    MAX_ATTEMPTS,
    loadGenres,
    loadArtists,
    loadSong,
    changeGenre,
    changeDifficulty,
    changeArtist,
    check,
    skip,
    search,
    togglePlay,
    changeVolume,
  };
}
