const API_URL = "http://localhost:3000/api";

const MAX_ATTEMPTS = 6;

const TIME_LIMITS = {
  1: 0.5,
  2: 1,
  3: 2,
  4: 5,
  5: 10,
  6: 30,
};

let currentSongId = null;
let currentAttempt = 1;
let isRegisterMode = false;
let animationFrameId = null;
let selectedGenre = "";

checkSession();
