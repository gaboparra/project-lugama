const API_URL = 'http://localhost:3000/api';
const MAX_ATTEMPTS = 6;

// Configuración de tiempos por intento
const TIME_LIMITS = {
    1: 0.5,
    2: 1,
    3: 2,
    4: 5,
    5: 10,
    6: 30
};

let currentSongId = null;
let currentAttempt = 1;
let isRegisterMode = false;
let animationFrameId = null; // Para el control preciso del audio

// --- AUTH ---
function showRegister() {
    isRegisterMode = !isRegisterMode;
    const title = document.getElementById('auth-title');
    const userField = document.getElementById('reg-username');
    const btn = document.getElementById('btn-main');
    const toggleLink = document.getElementById('toggle-text');

    if (isRegisterMode) {
        title.innerText = "Registro Lugama";
        userField.style.display = "block";
        btn.innerText = "Registrarse";
        btn.onclick = handleRegister;
        toggleLink.innerHTML = '¿Ya tenés cuenta? <a href="#" onclick="showRegister()">Logueate</a>';
    } else {
        title.innerText = "Login Lugama";
        userField.style.display = "none";
        btn.innerText = "Entrar";
        btn.onclick = handleLogin;
        toggleLink.innerHTML = '¿No tenés cuenta? <a href="#" onclick="showRegister()">Registrate acá</a>';
    }
}

async function handleRegister() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('email').value;
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
    const email = document.getElementById('email').value;
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
            document.getElementById('user-name').innerText = data.user.username;
            document.getElementById('user-points').innerText = data.user.points || 0;
            if(document.getElementById('user-stars')) document.getElementById('user-stars').innerText = data.user.stars || 0;
            loadNewSong();
        }
    } catch (err) { alert("Error de login"); }
}

// --- JUEGO ---
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// CONTROL DE FRACCIONAMIENTO PRECISO
function updateAudioLimit() {
    const audio = document.getElementById('song-preview');
    const limit = TIME_LIMITS[currentAttempt];
    const playerContainer = document.getElementById('player-container');

    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    function checkTime() {
        if (audio.currentTime >= limit) {
            audio.pause();
            audio.currentTime = 0;
            playerContainer.classList.add('limit-reached'); // Efecto visual
            setTimeout(() => playerContainer.classList.remove('limit-reached'), 500);
            cancelAnimationFrame(animationFrameId);
        } else {
            animationFrameId = requestAnimationFrame(checkTime);
        }
    }

    audio.onplay = () => checkTime();
    audio.onpause = () => cancelAnimationFrame(animationFrameId);
}

async function loadNewSong() {
    document.getElementById('song-info').style.display = 'none';
    document.getElementById('guess-input').value = "";
    document.getElementById('guess-input').disabled = false;
    
    try {
        const res = await fetch(`${API_URL}/songs/random`, { headers: getHeaders() });
        const song = await res.json();
        currentSongId = song._id;
        currentAttempt = 1;

        const audio = document.getElementById('song-preview');
        audio.src = song.previewUrl;
        audio.volume = 0.25;
        audio.currentTime = 0;

        refreshUI();
        updateAudioLimit();
    } catch (err) { console.error(err); }
}

function refreshUI() {
    const limit = TIME_LIMITS[currentAttempt];
    document.getElementById('attempt-count').innerText = `${currentAttempt} / ${MAX_ATTEMPTS}`;
    document.getElementById('current-limit-display').innerText = `${limit}s`;
    document.getElementById('feedback-message').innerText = `Intento ${currentAttempt}. ¡Escuchá con atención!`;
    document.getElementById('feedback-message').style.color = "black";
}

async function handleCheck() {
    const answer = document.getElementById('guess-input').value;
    const msg = document.getElementById('feedback-message');
    if (!answer) return;

    try {
        const res = await fetch(`${API_URL}/songs/validate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ songId: currentSongId, answer, attempt: currentAttempt })
        });
        const data = await res.json();

        if (data.correct) {
            let star = data.starEarned ? " ⭐ ¡ESTRELLA!" : "";
            msg.innerText = `¡Correcto! +${data.pointsEarned} pts.${star}`;
            msg.style.color = "green";
            document.getElementById('user-points').innerText = data.totalPoints;
            if(document.getElementById('user-stars')) document.getElementById('user-stars').innerText = data.totalStars;
            showFinalData(data.fullData);
        } else {
            if (currentAttempt >= MAX_ATTEMPTS) {
                msg.innerText = "Game Over. No la sacaste.";
                msg.style.color = "red";
                showFinalData(data.fullData);
            } else {
                currentAttempt++;
                refreshUI();
                updateAudioLimit();
                msg.innerText = "Incorrecto. Se habilitó más tiempo.";
                msg.style.color = "red";
            }
        }
    } catch (err) { console.error(err); }
}

async function handleSearch(query) {
    if (query.length < 2) return;
    try {
        const res = await fetch(`${API_URL}/songs/search?q=${query}`, { headers: getHeaders() });
        const songs = await res.json();
        const datalist = document.getElementById('songs-list');
        datalist.innerHTML = "";
        songs.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.title;
            opt.textContent = s.artist;
            datalist.appendChild(opt);
        });
    } catch (err) {}
}

function showFinalData(songData) {
    document.getElementById('guess-input').disabled = true;
    document.getElementById('song-info').style.display = 'block';
    document.getElementById('album-cover').src = songData.albumCover;
    document.getElementById('song-details').innerText = `${songData.title} - ${songData.artist}`;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    document.getElementById('song-preview').onplay = null; // Liberar audio
}