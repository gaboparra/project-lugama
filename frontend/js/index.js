// const API_URL = "http://localhost:3000/api";

const MAX_ATTEMPTS = 6;

const TIME_LIMITS = {
  1: 0.5,
  2: 1,
  3: 2,
  4: 5,
  5: 10,
  6: 30,
};

const fondos = [
  "../assets/backgrounds/fondo-coraje.png",
  "../assets/backgrounds/fondo-gengar.png",
  "../assets/backgrounds/gomu-gomu-expanded.png",
  "../assets/backgrounds/purple-city-expanded.png",
  "../assets/backgrounds/gengars-fondo.png",
  // agregás todos los que tengas
];

const fondoAleatorio = fondos[Math.floor(Math.random() * fondos.length)];
document.documentElement.style.setProperty(
  "--fondo-bg",
  `url('${fondoAleatorio}')`,
);

let currentSongId = null;
let currentAttempt = 1;
let isRegisterMode = false;
let animationFrameId = null;
let selectedGenre = "";

checkSession();
