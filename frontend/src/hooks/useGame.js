import { useState, useRef, useCallback } from "react";
import { getRandomSong, validateAnswer, searchSongs, getGenres } from "../api/songs";

export const TIME_LIMITS  = { 1: 0.5, 2: 1, 3: 2, 4: 5, 5: 10, 6: 30 };
export const MAX_ATTEMPTS = 6;

export default function useGame(onUserUpdate) {
  const [song,          setSong]          = useState(null);
  const [attempt,       setAttempt]       = useState(1);
  const [genre,         setGenre]         = useState("");
  const [genres,        setGenres]        = useState([]);
  const [difficulty,    setDifficulty]    = useState(null);
  const [feedback,      setFeedback]      = useState({ msg: "¡Dale Play para empezar!", type: "neutral" });
  const [revealedSong,  setRevealed]      = useState(null);
  const [guessDisabled, setGuessDisabled] = useState(false);
  const [suggestions,   setSuggestions]   = useState([]);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [currentTime,   setCurrentTime]   = useState(0);
  const [volume,        setVolume]        = useState(0.25);
  const [gameOver,      setGameOver]      = useState(false);

  const audioRef   = useRef(null);
  const frameRef   = useRef(null);
  const attemptRef = useRef(1);
  const gameOverRef = useRef(false);

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
    const time  = audio.currentTime;
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
      if (!gameOverRef.current) frameRef.current = requestAnimationFrame(animate);
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
    try { setGenres(await getGenres()); } catch {}
  }, []);

  const loadSong = useCallback(async (selectedGenre = genre, selectedDifficulty = difficulty) => {
    stopAudio();
    setRevealed(null);
    setGuessDisabled(false);
    setGameOver(false);
    gameOverRef.current = false;   // ← reset de la ref
    setSuggestions([]);
    setFeedback({ msg: "¡Dale Play para empezar!", type: "neutral" });
    attemptRef.current = 1;
    setAttempt(1);
    try {
      const data = await getRandomSong(selectedGenre, selectedDifficulty);
      setSong(data);
      if (audioRef.current) {
        audioRef.current.src = data.previewUrl;
        audioRef.current.load();
      }
    } catch (e) { console.error(e); }
  }, [genre, difficulty]);

  const changeGenre = useCallback((g) => {
    setGenre(g);
    loadSong(g, difficulty);
  }, [loadSong, difficulty]);

  const changeDifficulty = useCallback((d) => {
    setDifficulty(d);
    loadSong(genre, d);
  }, [loadSong, genre]);

  const advanceAttempt = (newAttempt) => {
    stopAudio();
    attemptRef.current = newAttempt;
    setAttempt(newAttempt);
  };

  const check = useCallback(async (answer) => {
    if (!song || !answer.trim()) return;
    try {
      const data = await validateAnswer(song._id, answer, attemptRef.current);
      if (data.correct) {
        const star = data.starEarned ? " ⭐ ¡ESTRELLA!" : "";
        setFeedback({ msg: `¡Correcto! +${data.pointsEarned} pts.${star}`, type: "correct" });
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
    } catch (e) { console.error(e); }
  }, [song, onUserUpdate]);

  const skip = useCallback(() => {
    if (guessDisabled) return;
    if (attemptRef.current >= MAX_ATTEMPTS) return;
    advanceAttempt(attemptRef.current + 1);
    setFeedback({ msg: "Intento saltado.", type: "neutral" });
  }, [guessDisabled]);

  const search = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try { setSuggestions(await searchSongs(q)); } catch {}
  }, []);

  return {
    song, attempt, genre, genres, difficulty, feedback,
    revealedSong, guessDisabled, suggestions,
    isPlaying, currentTime, volume, gameOver,
    audioRef, TIME_LIMITS, MAX_ATTEMPTS,
    loadGenres, loadSong, changeGenre, changeDifficulty,
    check, skip, search, togglePlay, changeVolume,
  };
}