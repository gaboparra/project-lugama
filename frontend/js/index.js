const API = 'http://localhost:3000/api';
let state = {
  token: localStorage.getItem('lgm_token') || null,
  user: JSON.parse(localStorage.getItem('lgm_user') || 'null'),
  currentSong: null,
  attempt: 1,
  maxAttempts: 6,
  gameOver: false,
  playing: false,
};

// ─── INIT ───
window.addEventListener('DOMContentLoaded', () => {
  updateNav();
  const hash = location.hash.replace('#','') || 'home';
  navigate(hash);
});

window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#','') || 'home';
  navigate(hash, false);
});

// ─── NAV ───
function navigate(view, pushHash=true) {
  const allowed = ['home','login','register','game','ranking','profile','admin'];
  if (!allowed.includes(view)) view = 'home';

  // Auth guard
  if (view === 'game' && !state.token) { navigate('login'); return; }
  if (view === 'profile' && !state.token) { navigate('login'); return; }
  if (view === 'admin') {
    if (!state.token || state.user?.role !== 'admin') { navigate('home'); return; }
  }

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view)?.classList.add('active');
  if (pushHash) location.hash = view;

  // On view load hooks
  if (view === 'ranking') loadRanking();
  if (view === 'profile') loadProfile();
  if (view === 'game') loadGame();
  if (view === 'admin') loadDbSongs();
  if (view === 'home') loadHomeStats();
}

function updateNav() {
  const nr = document.getElementById('nav-right');
  if (state.token && state.user) {
    let adminBtn = state.user.role === 'admin'
      ? `<button class="btn btn-ghost btn-sm" onclick="navigate('admin')">Admin</button>` : '';
    nr.innerHTML = `
      ${adminBtn}
      <div class="nav-pts">★ <span id="nav-pts-val">${state.user.points || 0}</span></div>
      <button class="btn btn-ghost btn-sm" onclick="navigate('profile')">${state.user.username}</button>
      <button class="btn btn-ghost btn-sm" onclick="doLogout()">Salir</button>
    `;
  } else {
    nr.innerHTML = `
      <button class="btn btn-ghost btn-sm" onclick="navigate('login')">Iniciar sesión</button>
      <button class="btn btn-primary btn-sm" onclick="navigate('register')">Registrarse</button>
    `;
  }
}

function updateNavPts(pts) {
  const el = document.getElementById('nav-pts-val');
  if (el) el.textContent = pts;
  if (state.user) state.user.points = pts;
  localStorage.setItem('lgm_user', JSON.stringify(state.user));
}

// ─── AUTH ───
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  if (!email || !password) { showErr(errEl, 'Completá todos los campos'); return; }

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';
  try {
    const r = await api('POST', '/auth/login', { email, password });
    state.token = r.token;
    state.user = r.user;
    localStorage.setItem('lgm_token', r.token);
    localStorage.setItem('lgm_user', JSON.stringify(r.user));
    updateNav();
    showToast('¡Bienvenido, ' + r.user.username + '!', 'success');
    navigate('home');
  } catch(e) {
    showErr(errEl, e.message || 'Credenciales inválidas');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Ingresar';
  }
}

async function doRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const btn = document.getElementById('register-btn');
  const errEl = document.getElementById('register-error');
  errEl.style.display = 'none';

  if (!username || !email || !password) { showErr(errEl, 'Completá todos los campos'); return; }
  if (password.length < 6) { showErr(errEl, 'La contraseña debe tener al menos 6 caracteres'); return; }

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';
  try {
    await api('POST', '/auth/register', { username, email, password });
    showToast('¡Cuenta creada! Iniciá sesión', 'success');
    navigate('login');
  } catch(e) {
    showErr(errEl, e.message || 'Error al registrarse');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Crear cuenta';
  }
}

function doLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('lgm_token');
  localStorage.removeItem('lgm_user');
  stopAudio();
  updateNav();
  showToast('Sesión cerrada', 'info');
  navigate('home');
}

// ─── HOME STATS ───
async function loadHomeStats() {
  if (!state.token || !state.user) return;
  const statsEl = document.getElementById('home-stats');
  statsEl.style.display = 'flex';
  try {
    const [ranking, songCount] = await Promise.all([
      api('GET', '/users/ranking'),
      api('GET', '/songs/all')
    ]);
    document.getElementById('stat-songs').textContent = songCount.length;
    document.getElementById('stat-pts').textContent = state.user.points || 0;
    const myPos = ranking.findIndex(u => u._id === state.user.id) + 1;
    document.getElementById('stat-pos').textContent = myPos || '—';
  } catch(e) {}
}

// ─── GAME ───
async function startGame() {
  if (!state.token) { navigate('login'); return; }
  state.attempt = 1;
  state.gameOver = false;
  state.currentSong = null;
  stopAudio();
  resetAttemptDots();
  document.getElementById('result-card').style.display = 'none';
  document.getElementById('player-card').style.display = 'flex';
  document.getElementById('answer-form').style.display = 'flex';
  document.getElementById('answer-input').value = '';
  document.getElementById('answer-input').disabled = false;
  document.getElementById('submit-btn').disabled = false;
  document.getElementById('album-img').className = 'album-cover';
  document.getElementById('album-overlay').style.display = 'flex';
  document.getElementById('attempt-num').textContent = '1';
  navigate('game', true);
  await fetchRandomSong();
}

async function loadGame() {
  if (!state.currentSong) await fetchRandomSong();
}

async function fetchRandomSong() {
  const card = document.getElementById('player-card');
  card.style.opacity = '0.5';
  try {
    const song = await api('GET', '/songs/random');
    state.currentSong = song;
    const img = document.getElementById('album-img');
    img.src = song.albumCover;
    setupAudio(song.previewUrl);
    card.style.opacity = '1';
  } catch(e) {
    showToast('Error al cargar canción', 'error');
    card.style.opacity = '1';
  }
}

async function submitAnswer() {
  if (state.gameOver || !state.currentSong) return;
  const answer = document.getElementById('answer-input').value.trim();
  if (!answer) return;

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';

  try {
    const r = await api('POST', '/songs/validate', {
      songId: state.currentSong._id,
      answer,
      attempt: state.attempt
    });

    if (r.correct) {
      state.gameOver = true;
      revealAlbum();
      showResult(true, r);
      updateNavPts(r.totalPoints);
    } else {
      markAttemptUsed();
      state.attempt++;
      document.getElementById('attempt-num').textContent = state.attempt;
      document.getElementById('answer-input').value = '';

      if (state.attempt > state.maxAttempts) {
        state.gameOver = true;
        revealAlbum();
        showResult(false, null);
      } else {
        showToast('Incorrecto, te quedan ' + (state.maxAttempts - state.attempt + 1) + ' intentos', 'error');
      }
    }
  } catch(e) {
    showToast('Error al validar', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Enviar';
  }
}

function skipSong() {
  state.gameOver = true;
  revealAlbum();
  showResult(false, null, true);
}

function showResult(won, data, skipped=false) {
  stopAudio();
  document.getElementById('answer-form').style.display = 'none';
  const rc = document.getElementById('result-card');
  rc.style.display = 'block';

  const icon = document.getElementById('result-icon');
  const title = document.getElementById('result-title');
  const subtitle = document.getElementById('result-subtitle');
  const ptsEl = document.getElementById('pts-earned');
  const ptsLabel = document.getElementById('pts-earned-label');

  if (won) {
    icon.className = 'result-icon win';
    icon.innerHTML = '🎵';
    title.textContent = '¡La adivinaste!';
    subtitle.textContent = `La adivinaste en el intento ${state.attempt}. ¡Buen oído!`;
    ptsEl.textContent = '+' + data.pointsEarned + ' pts';
    ptsEl.style.display = 'block';
    ptsLabel.textContent = 'Total: ' + data.totalPoints + ' puntos';
    ptsLabel.style.display = 'block';
  } else if (skipped) {
    icon.className = 'result-icon lose';
    icon.innerHTML = '⏭️';
    title.textContent = 'Saltaste la canción';
    subtitle.textContent = 'No se restaron puntos. ¡Probá con otra!';
    ptsEl.style.display = 'none';
    ptsLabel.style.display = 'none';
  } else {
    icon.className = 'result-icon lose';
    icon.innerHTML = '💀';
    title.textContent = 'Se acabaron los intentos';
    subtitle.textContent = 'Más suerte la próxima. La canción era:';
    ptsEl.style.display = 'none';
    ptsLabel.style.display = 'none';
  }

  if (state.currentSong) {
    document.getElementById('result-cover-img').src = state.currentSong.albumCover;
    document.getElementById('result-song-title').textContent = state.currentSong.title;
    document.getElementById('result-song-artist').textContent = state.currentSong.artist;
  }
}

function revealAlbum() {
  document.getElementById('album-img').classList.add('revealed');
  document.getElementById('album-overlay').style.display = 'none';
}

function resetAttemptDots() {
  const dots = document.querySelectorAll('.attempt-dot');
  dots.forEach((d, i) => {
    d.className = 'attempt-dot' + (i === 0 ? ' active' : '');
  });
}

function markAttemptUsed() {
  const dots = document.querySelectorAll('.attempt-dot');
  const idx = state.attempt - 1;
  if (dots[idx]) dots[idx].className = 'attempt-dot used';
  if (dots[idx+1]) dots[idx+1].className = 'attempt-dot active';
}

// ─── AUDIO ───
const audio = document.getElementById('audio-player');
let progressInterval = null;

function setupAudio(url) {
  audio.src = url;
  audio.load();
  updateProgress();
  audio.addEventListener('ended', () => {
    state.playing = false;
    setPlayIcon(false);
    clearInterval(progressInterval);
  });
}

function togglePlay() {
  if (!audio.src) return;
  if (state.playing) {
    audio.pause();
    state.playing = false;
    setPlayIcon(false);
    clearInterval(progressInterval);
  } else {
    audio.play().catch(() => {});
    state.playing = true;
    setPlayIcon(true);
    progressInterval = setInterval(updateProgress, 100);
  }
}

function stopAudio() {
  audio.pause();
  audio.src = '';
  state.playing = false;
  setPlayIcon(false);
  clearInterval(progressInterval);
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('time-current').textContent = '0:00';
}

function setPlayIcon(playing) {
  const icon = document.getElementById('play-icon');
  if (playing) {
    icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
  } else {
    icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  }
}

function updateProgress() {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('time-current').textContent = formatTime(audio.currentTime);
  document.getElementById('time-total').textContent = formatTime(audio.duration);
}

function seekAudio(e) {
  if (!audio.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const pct = x / rect.width;
  audio.currentTime = pct * audio.duration;
  updateProgress();
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// ─── RANKING ───
async function loadRanking() {
  const list = document.getElementById('ranking-list');
  list.innerHTML = '<div class="loading-overlay"><div class="spinner"></div> Cargando...</div>';
  try {
    const ranking = await api('GET', '/users/ranking');
    if (!ranking.length) { list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">No hay jugadores aún</p>'; return; }
    const myId = state.user?.id;
    list.innerHTML = ranking.map((u, i) => {
      const pos = i + 1;
      const posClass = pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : '';
      const isMe = u._id === myId;
      return `
        <div class="ranking-item ${isMe ? 'me' : ''}">
          <div class="ranking-pos ${posClass}">${pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '#'+pos}</div>
          <div class="ranking-avatar">${u.username.charAt(0)}</div>
          <div class="ranking-username">${escHtml(u.username)} ${isMe ? '<span style="font-size:11px;color:var(--accent)">(vos)</span>' : ''}</div>
          <div>
            <div class="ranking-pts">${u.points}</div>
            <div class="ranking-pts-label">pts</div>
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    list.innerHTML = '<p style="color:var(--danger);text-align:center;padding:40px">Error al cargar ranking</p>';
  }
}

// ─── PROFILE ───
async function loadProfile() {
  try {
    const user = await api('GET', '/users/me');
    document.getElementById('profile-avatar').textContent = user.username.charAt(0);
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-pts').textContent = '★ ' + user.points + ' puntos';
    document.getElementById('new-username').value = user.username;
  } catch(e) {}
}

async function doUpdateProfile() {
  const username = document.getElementById('new-username').value.trim();
  if (!username) { showToast('Ingresá un usuario', 'error'); return; }
  try {
    const r = await api('PUT', '/users/update-profile', { username });
    state.user.username = r.user.username;
    localStorage.setItem('lgm_user', JSON.stringify(state.user));
    updateNav();
    loadProfile();
    showToast('Usuario actualizado', 'success');
  } catch(e) { showToast(e.message || 'Error', 'error'); }
}

async function doChangePassword() {
  const currentPassword = document.getElementById('cur-password').value;
  const newPassword = document.getElementById('new-password').value;
  if (!currentPassword || !newPassword) { showToast('Completá ambos campos', 'error'); return; }
  if (newPassword.length < 6) { showToast('La nueva contraseña debe tener al menos 6 caracteres', 'error'); return; }
  try {
    await api('PUT', '/users/change-password', { currentPassword, newPassword });
    document.getElementById('cur-password').value = '';
    document.getElementById('new-password').value = '';
    showToast('Contraseña actualizada', 'success');
  } catch(e) { showToast(e.message || 'Error', 'error'); }
}

function openDeleteModal() {
  document.getElementById('delete-modal').classList.add('open');
}
function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('open');
}

async function doDeleteAccount() {
  try {
    await api('DELETE', '/users/delete-account');
    closeDeleteModal();
    doLogout();
    showToast('Cuenta eliminada', 'info');
  } catch(e) { showToast(e.message || 'Error', 'error'); }
}

// ─── ADMIN ───
function setAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach((t, i) => {
    const tabs = ['search', 'db', 'seed'];
    t.classList.toggle('active', tabs[i] === tab);
  });
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('admin-' + tab).classList.add('active');
  if (tab === 'db') loadDbSongs();
}

async function searchDeezer() {
  const q = document.getElementById('deezer-query').value.trim();
  if (!q) return;
  const container = document.getElementById('deezer-results');
  container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div> Buscando...</div>';
  try {
    const songs = await api('GET', `/songs/search-external?query=${encodeURIComponent(q)}`);
    if (!songs.length) { container.innerHTML = '<p style="color:var(--text-muted);padding:20px 0">Sin resultados</p>'; return; }
    container.innerHTML = songs.map(s => `
      <div class="song-row">
        <img class="song-row-cover" src="${escHtml(s.albumCover)}" alt="" />
        <div class="song-row-info">
          <div class="song-row-title">${escHtml(s.title)}</div>
          <div class="song-row-artist">${escHtml(s.artist)}</div>
        </div>
        <div class="song-row-actions">
          <button class="btn btn-primary btn-sm" onclick="addSongFromDeezer(${JSON.stringify(s).split('"').join('&quot;')})">Agregar</button>
        </div>
      </div>
    `).join('');
  } catch(e) { container.innerHTML = '<p style="color:var(--danger);padding:20px 0">Error al buscar</p>'; }
}

async function addSongFromDeezer(songData) {
  try {
    if (typeof songData === 'string') songData = JSON.parse(songData);
    await api('POST', '/songs/add', { ...songData, difficulty: 1 });
    showToast('Canción agregada: ' + songData.title, 'success');
  } catch(e) { showToast(e.message || 'Error al agregar', 'error'); }
}

async function loadDbSongs(q='') {
  const container = document.getElementById('db-results');
  container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
  try {
    const songs = await api('GET', `/songs/search?q=${encodeURIComponent(q)}`);
    if (!songs.length) { container.innerHTML = '<p style="color:var(--text-muted);padding:20px 0">Sin canciones en la base</p>'; return; }
    container.innerHTML = songs.map(s => `
      <div class="song-row" id="srow-${s._id}">
        <img class="song-row-cover" src="${escHtml(s.albumCover)}" alt="" />
        <div class="song-row-info">
          <div class="song-row-title">${escHtml(s.title)}</div>
          <div class="song-row-artist">${escHtml(s.artist)}</div>
        </div>
        <span class="diff-badge diff-${s.difficulty || 1}">${s.difficulty === 2 ? 'Medio' : s.difficulty === 3 ? 'Difícil' : 'Fácil'}</span>
        <div class="song-row-actions">
          <button class="btn btn-danger btn-sm" onclick="deleteSong('${s._id}')">Eliminar</button>
        </div>
      </div>
    `).join('');
  } catch(e) { container.innerHTML = '<p style="color:var(--danger);padding:20px 0">Error al cargar</p>'; }
}

function searchDb() {
  const q = document.getElementById('db-query').value.trim();
  loadDbSongs(q);
}

async function deleteSong(id) {
  try {
    await api('DELETE', `/songs/delete/${id}`);
    document.getElementById('srow-' + id)?.remove();
    showToast('Canción eliminada', 'success');
  } catch(e) { showToast(e.message || 'Error', 'error'); }
}

async function runSeed() {
  const btn = document.getElementById('seed-btn');
  const result = document.getElementById('seed-result');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Ejecutando...';
  result.style.display = 'none';
  try {
    const r = await api('POST', '/songs/seed');
    result.style.display = 'block';
    result.innerHTML = `✅ Proceso completado<br>Nuevas: <strong>${r.new_songs}</strong> | Saltadas: <strong>${r.skipped_due_to_duplicates}</strong> | Total: <strong>${r.total_in_db}</strong>`;
    result.style.color = 'var(--success)';
  } catch(e) {
    result.style.display = 'block';
    result.textContent = '❌ ' + (e.message || 'Error en seed');
    result.style.color = 'var(--danger)';
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Ejecutar Seed';
  }
}

// ─── API HELPER ───
async function api(method, path, body=null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (state.token) opts.headers['Authorization'] = 'Bearer ' + state.token;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error ' + res.status);
  return data;
}

// ─── UI HELPERS ───
function showToast(msg, type='info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.className = '', 3000);
}

function showErr(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}