const API_URL = 'http://localhost:3000/api';
const MAX_ATTEMPTS = 6;
const TIME_LIMITS = { 1: 0.5, 2: 1, 3: 2, 4: 5, 5: 10, 6: 30 };

let currentSongId = null;
let currentAttempt = 1;
let isRegisterMode = false;
let animationFrameId = null;
let selectedGenre = "";

// ── AUTH ────────────────────────────────────────────────────────────────────

function showRegister() {
  isRegisterMode = !isRegisterMode;
  const title      = document.getElementById('auth-title');
  const userField  = document.getElementById('reg-username');
  const btn        = document.getElementById('btn-main');
  const toggleLink = document.getElementById('toggle-text');

  if (isRegisterMode) {
    title.innerText = "Registro";
    userField.style.display = "block";
    btn.innerText = "Registrarse";
    btn.onclick = handleRegister;
    toggleLink.innerHTML = '¿Ya tenés cuenta? <a href="#" onclick="showRegister()">Logueate</a>';
  } else {
    title.innerText = "Login";
    userField.style.display = "none";
    btn.innerText = "Entrar";
    btn.onclick = handleLogin;
    toggleLink.innerHTML = '¿No tenés cuenta? <a href="#" onclick="showRegister()">Registrate acá</a>';
  }
}

async function handleRegister() {
  const username = document.getElementById('reg-username').value;
  const email    = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    if (res.ok) { alert("¡Registro exitoso!"); showRegister(); }
  } catch (err) { alert("Error al registrar"); }
}

async function handleLogin() {
  const email    = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      document.getElementById('auth-section').style.display = 'none';
      document.getElementById('game-section').style.display = 'block';
      document.getElementById('user-name').innerText   = data.user.username;
      document.getElementById('user-points').innerText = data.user.points || 0;
      document.getElementById('user-stars').innerText  = data.user.stars  || 0;
      await fetchGenres();
      loadNewSong();
    }
  } catch (err) { alert("Error de login"); }
}

async function checkSession() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
    if (!res.ok) { localStorage.removeItem('token'); return; }
    const data = await res.json();
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'block';
    document.getElementById('user-name').innerText   = data.username;
    document.getElementById('user-points').innerText = data.points || 0;
    document.getElementById('user-stars').innerText  = data.stars  || 0;
    await fetchGenres();
    loadNewSong();
  } catch (err) { localStorage.removeItem('token'); }
}

function handleLogout() {
  localStorage.removeItem('token');
  document.getElementById('game-section').style.display = 'none';
  const authSection = document.getElementById('auth-section');
  authSection.style.display = 'flex';
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// ── GÉNEROS ──────────────────────────────────────────────────────────────────

async function fetchGenres() {
  try {
    const res    = await fetch(`${API_URL}/songs/genres`, { headers: getHeaders() });
    const genres = await res.json();
    const select = document.getElementById('genre-select');
    select.innerHTML = '<option value="">Aleatorio</option>';
    genres.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g; opt.textContent = g;
      select.appendChild(opt);
    });
  } catch (err) { console.error("Error cargando géneros:", err); }
}

function changeGenre() {
  selectedGenre = document.getElementById('genre-select').value;
  loadNewSong();
}

// ── DOTS ─────────────────────────────────────────────────────────────────────

function updateDots() {
  document.querySelectorAll('#dots .dot').forEach((dot, i) => {
    dot.className = 'dot';
    if (i < currentAttempt - 1)     dot.classList.add('done');
    else if (i === currentAttempt - 1) dot.classList.add('active');
  });
}

// ── SONGLES PLAYER ───────────────────────────────────────────────────────────

/**
 * Construye los segmentos de la barra Songles.
 * Cada segmento representa el tiempo INCREMENTAL de ese intento.
 * La anchura de cada segmento es proporcional a su duración incremental
 * respecto al total (TIME_LIMITS[MAX_ATTEMPTS] = 30s).
 */
function buildSonglesBar() {
  const wrap = document.getElementById('songles-bar-wrap');
  wrap.innerHTML = '';

  const totalTime = TIME_LIMITS[MAX_ATTEMPTS]; // 30s

  // Indicador triangular (se posiciona encima de los segmentos)
  const indicator = document.createElement('div');
  indicator.className = 'songles-indicator';
  indicator.id = 'songles-indicator';
  indicator.style.left = '0%';
  wrap.appendChild(indicator);

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const prev        = TIME_LIMITS[i - 1] || 0;
    const segDuration = TIME_LIMITS[i] - prev;
    const widthPct    = (segDuration / totalTime) * 100;

    const seg  = document.createElement('div');
    seg.className = 'songles-segment';
    seg.id = `seg-${i}`;
    seg.style.flexBasis = `${widthPct}%`;
    seg.style.flexGrow  = '0';

    const fill = document.createElement('div');
    fill.className = 'seg-fill';
    seg.appendChild(fill);
    wrap.appendChild(seg);
  }

  updateSonglesState();
}

/** Aplica clases done/active a cada segmento según el intento actual */
function updateSonglesState() {
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const seg = document.getElementById(`seg-${i}`);
    if (!seg) continue;
    seg.className = 'songles-segment';
    const fill = seg.querySelector('.seg-fill');
    if (fill) fill.style.width = '0%';
    if (i < currentAttempt)          seg.classList.add('done');
    else if (i === currentAttempt)   seg.classList.add('active');
  }
  // Resetear indicador al inicio
  const indicator = document.getElementById('songles-indicator');
  if (indicator) indicator.style.left = '0%';
  const timeText = document.getElementById('songles-time-text');
  if (timeText) timeText.textContent = '0.0s';
}

/** Configura el límite de tiempo y la animación del reproductor */
function updateAudioLimit() {
  const audio = document.getElementById('song-preview');
  const limit = TIME_LIMITS[currentAttempt];

  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  function animateSongles() {
    const t        = audio.currentTime;
    const fill     = document.querySelector(`#seg-${currentAttempt} .seg-fill`);
    const indicator = document.getElementById('songles-indicator');
    const wrap     = document.getElementById('songles-bar-wrap');
    const timeText = document.getElementById('songles-time-text');

    // Mostrar tiempo actual
    if (timeText) timeText.textContent = `${t.toFixed(1)}s`;

    // Progreso dentro del segmento activo
    const segStart    = TIME_LIMITS[currentAttempt - 1] || 0;
    const segDuration = limit - segStart;
    const progress    = Math.min((t - segStart) / segDuration, 1) * 100;
    if (fill) fill.style.width = `${progress}%`;

    // Posición del indicador triangular sobre el wrap completo
    if (indicator && wrap) {
      const totalTime  = TIME_LIMITS[MAX_ATTEMPTS];
      const leftPct    = Math.min((t / totalTime) * 100, 100);
      indicator.style.left = `${leftPct}%`;
    }

    // Límite de tiempo alcanzado
    if (t >= limit) {
      audio.pause();
      audio.currentTime = 0;
      if (fill) fill.style.width = '0%';
      if (timeText) timeText.textContent = '0.0s';
      if (indicator) indicator.style.left = '0%';
      setPlayIcon(false);
      cancelAnimationFrame(animationFrameId);

      const player = document.getElementById('player-container');
      player.classList.add('limit-reached');
      setTimeout(() => player.classList.remove('limit-reached'), 500);
    } else {
      animationFrameId = requestAnimationFrame(animateSongles);
    }
  }

  audio.onplay  = () => { setPlayIcon(true);  animateSongles(); };
  audio.onpause = () => { setPlayIcon(false); cancelAnimationFrame(animationFrameId); };
}

/** Alterna play / pause */
function togglePlay() {
  const audio = document.getElementById('song-preview');
  if (audio.paused) audio.play();
  else              audio.pause();
}

/** Sincroniza los íconos del botón play/pause */
function setPlayIcon(playing) {
  document.getElementById('play-icon').style.display  = playing ? 'none'  : 'block';
  document.getElementById('pause-icon').style.display = playing ? 'block' : 'none';
}

// ── JUEGO ────────────────────────────────────────────────────────────────────

async function loadNewSong() {
  document.getElementById('song-info').style.display    = 'none';
  document.getElementById('guess-input').value          = "";
  document.getElementById('guess-input').disabled       = false;
  document.getElementById('songs-list').innerHTML       = "";

  try {
    let url = `${API_URL}/songs/random`;
    if (selectedGenre) url += `?genre=${encodeURIComponent(selectedGenre)}`;

    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) { alert("No hay canciones disponibles"); return; }

    const song     = await res.json();
    currentSongId  = song._id;
    currentAttempt = 1;

    const audio     = document.getElementById('song-preview');
    audio.src       = song.previewUrl;
    audio.volume    = 0.25;
    audio.currentTime = 0;

    setPlayIcon(false);
    refreshUI();
    buildSonglesBar();
    updateAudioLimit();
  } catch (err) { console.error(err); }
}

function refreshUI() {
  const limit = TIME_LIMITS[currentAttempt];
  document.getElementById('attempt-count').innerText          = `${currentAttempt} / ${MAX_ATTEMPTS}`;
  document.getElementById('current-limit-display').innerText  = `${limit}s`;
  document.getElementById('feedback-message').innerText       = `Intento ${currentAttempt}. Escuchás ${limit}s.`;
  document.getElementById('feedback-message').style.color     = "black";
  updateDots();
  updateSonglesState();
}

async function handleCheck() {
  const answer = document.getElementById('guess-input').value;
  const msg    = document.getElementById('feedback-message');

  try {
    const res = await fetch(`${API_URL}/songs/validate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ songId: currentSongId, answer, attempt: currentAttempt })
    });
    const data = await res.json();

    if (data.correct) {
      const star = data.starEarned ? " ⭐ ¡+1 ESTRELLA!" : "";
      msg.innerText    = `¡Correcto! +${data.pointsEarned} pts.${star}`;
      msg.style.color  = "green";
      document.getElementById('user-points').innerText = data.totalPoints;
      document.getElementById('user-stars').innerText  = data.totalStars;
      showFinalData(data.fullData);
    } else {
      if (currentAttempt >= MAX_ATTEMPTS) {
        msg.innerText   = "Game Over.";
        msg.style.color = "red";
        showFinalData(data.fullData);
      } else {
        currentAttempt++;
        refreshUI();
        updateAudioLimit();
        msg.innerText   = "Incorrecto, al final sos un poser";
        msg.style.color = "red";
      }
    }
  } catch (err) { console.error(err); }
}

function handleSkip() {
  if (document.getElementById('guess-input').disabled) return;
  if (currentAttempt >= MAX_ATTEMPTS) {
    handleCheck();
  } else {
    currentAttempt++;
    refreshUI();
    updateAudioLimit();
    document.getElementById('feedback-message').innerText = "Intento skipeado.";
    document.getElementById('guess-input').value = "";
  }
}

async function handleSearch(query) {
  if (query.length < 2) return;
  try {
    const res   = await fetch(`${API_URL}/songs/search?q=${query}`, { headers: getHeaders() });
    const songs = await res.json();
    const list  = document.getElementById('songs-list');
    list.innerHTML = "";
    songs.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.title; opt.textContent = s.artist;
      list.appendChild(opt);
    });
  } catch (err) {}
}

function showFinalData(songData) {
  document.getElementById('guess-input').disabled    = true;
  document.getElementById('song-info').style.display = 'flex';
  document.getElementById('album-cover').src         = songData.albumCover;
  document.getElementById('song-details').innerText  = `${songData.title} - ${songData.artist}`;

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  const audio = document.getElementById('song-preview');
  audio.onplay  = null;
  audio.onpause = null;
  setPlayIcon(false);
}

function toggleInstructions() {
  const modal = document.getElementById("instructions-modal");
  modal.classList.toggle("show");
}

// cerrar si clickean afuera
document.addEventListener("click", function(e){
  const modal = document.getElementById("instructions-modal");
  const button = document.querySelector(".help-btn");

  if (!modal || !button) return;

  if (
    !modal.contains(e.target) &&
    !button.contains(e.target)
  ){
    modal.classList.remove("show");
  }
});

// ── INIT ─────────────────────────────────────────────────────────────────────
checkSession();