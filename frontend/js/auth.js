window.isRegisterMode = false;
window.API_URL = "http://localhost:3000/api";

window.getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── ERROR INLINE ──────────────────────────────────────────────────────────────
function showAuthError(msg) {
    const el = document.getElementById("auth-error");
    el.textContent = msg;
    el.style.display = "block";
}

function clearAuthError() {
    const el = document.getElementById("auth-error");
    el.textContent = "";
    el.style.display = "none";
}

// ── GOOGLE ────────────────────────────────────────────────────────────────────
window.handleGoogleLogin = async function (response) {
    clearAuthError();
    try {
        const res  = await fetch(`${window.API_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: response.credential }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
            await window.completeAuth(data);
        } else {
            showAuthError(data.error || "Error al iniciar sesión con Google");
        }
    } catch (err) {
        showAuthError("Error de conexión con el servidor");
    }
};

// ── COMPLETAR AUTH ────────────────────────────────────────────────────────────
window.completeAuth = async function (data) {
    localStorage.setItem("token", data.token);
    try {
        const res = await fetch(`${window.API_URL}/auth/me`, {
            headers: window.getHeaders(),
        });
        if (!res.ok) {
            localStorage.removeItem("token");
            showAuthError("No se pudo obtener el perfil");
            return;
        }
        const user = await res.json();

        document.getElementById("auth-section").style.display = "none";
        document.getElementById("game-section").style.display = "block";
        document.getElementById("user-name").innerText   = user.username;
        document.getElementById("user-points").innerText = user.points ?? 0;
        document.getElementById("user-stars").innerText  = user.stars  ?? 0;

        if (typeof fetchGenres === "function") {
            await fetchGenres();
            if (typeof loadNewSong === "function") loadNewSong();
        }
    } catch (err) {
        showAuthError("Error al obtener el perfil");
    }
};

// ── UI LOGIN / REGISTRO ───────────────────────────────────────────────────────
window.showRegister = function () {
    window.isRegisterMode = !window.isRegisterMode;
    clearAuthError();

    const title      = document.getElementById("auth-title");
    const userField  = document.getElementById("reg-username");
    const btn        = document.getElementById("btn-main");
    const toggleLink = document.getElementById("toggle-text");
    const googleBtn  = document.getElementById("google-btn-container");

    if (window.isRegisterMode) {
        title.innerText = "Registro";
        userField.style.display = "block";
        btn.innerText = "Registrarse";
        btn.onclick = window.handleRegister;
        if (googleBtn) googleBtn.style.setProperty("display", "none", "important");
        toggleLink.innerHTML = '¿Ya tenés cuenta? <a href="#" onclick="showRegister()">Logueate</a>';
    } else {
        title.innerText = "Login";
        userField.style.display = "none";
        btn.innerText = "Entrar";
        btn.onclick = window.handleLogin;
        if (googleBtn) googleBtn.style.setProperty("display", "flex", "important");
        toggleLink.innerHTML = '¿No tenés cuenta? <a href="#" onclick="showRegister()">Registrate acá</a>';
    }
};

// ── HANDLERS ──────────────────────────────────────────────────────────────────
window.handleLogin = async function () {
    clearAuthError();
    const email    = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res  = await fetch(`${window.API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
            showAuthError(data.error === "Invalid credentials"
                ? "Email o contraseña incorrectos"
                : data.error || "Error al iniciar sesión"
            );
            return;
        }

        await window.completeAuth(data);
    } catch (err) {
        showAuthError("Error al conectar con el servidor");
    }
};

window.handleRegister = async function () {
    clearAuthError();
 
    const username = document.getElementById("reg-username").value.trim();
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
 
    // ── VALIDACIONES CLIENTE ──────────────────────────────────────────────────
    if (!username || !email || !password) {
        showAuthError("Completá todos los campos");
        return;
    }
    if (username.length < 1 || username.length > 30) {
        showAuthError("El usuario tiene que tener entre 1 y 30 caracteres");
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showAuthError("El email no tiene un formato válido");
        return;
    }
    if (password.length < 6) {
        showAuthError("La contraseña tiene que tener al menos 6 caracteres");
        return;
    }
 
    // ── FETCH ─────────────────────────────────────────────────────────────────
    try {
        const res  = await fetch(`${window.API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
 
        if (!res.ok) {
            // el back devuelve "User or email already in use" si ya existen
            showAuthError(data.error === "User or email already in use"
                ? "El usuario o email ya están en uso"
                : data.error || "Error al registrar"
            );
            return;
        }
 
        await window.completeAuth(data);
    } catch (err) {
        showAuthError("Error de conexión");
    }
};

window.checkSession = async function () {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${window.API_URL}/auth/me`, {
            headers: window.getHeaders(),
        });
        if (!res.ok) { localStorage.removeItem("token"); return; }

        const user = await res.json();
        await window.completeAuth({ token, user });
    } catch (err) {
        localStorage.removeItem("token");
    }
};

window.handleLogout = function () {
    localStorage.removeItem("token");
    location.reload();
};