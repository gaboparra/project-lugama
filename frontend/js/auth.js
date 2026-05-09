// Variables globales
window.isRegisterMode = false;
window.API_URL = "http://localhost:3000/api";

// Configuración de Headers
window.getHeaders = function() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
};

// --- CALLBACK DE GOOGLE ---
window.handleGoogleLogin = async function(response) {
    // console.log("Token recibido de Google");
    try {
        const res = await fetch(`${window.API_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: response.credential }),
        });

        const data = await res.json();

        if (res.ok && data.token) {
            window.completeAuth(data);
        } else {
            alert("Error en validación con el servidor: " + (data.error || "Token inválido"));
        }
    } catch (error) {
        console.error("Error en handleGoogleLogin:", error);
        alert("Error de conexión con el backend");
    }
};

// --- LÓGICA DE UI (LOGIN/REGISTRO) ---
window.showRegister = function() {
    window.isRegisterMode = !window.isRegisterMode;

    const title = document.getElementById("auth-title");
    const userField = document.getElementById("reg-username");
    const btn = document.getElementById("btn-main");
    const toggleLink = document.getElementById("toggle-text");
    const googleBtn = document.getElementById("google-btn-container");

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

// --- COMPLETAR SESIÓN ---
window.completeAuth = function(data) {
    localStorage.setItem("token", data.token);
    
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("game-section").style.display = "block";

    document.getElementById("user-name").innerText = data.user.username;
    document.getElementById("user-points").innerText = data.user.points || 0;
    document.getElementById("user-stars").innerText = data.user.stars || 0;

    // Ejecutar carga de géneros y canción si las funciones existen
    if (typeof fetchGenres === "function") {
        fetchGenres().then(() => {
            if (typeof loadNewSong === "function") loadNewSong();
        });
    }
};

// --- MANEJADORES DE FORMULARIO ---
window.handleLogin = async function() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(`${window.API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.ok && data.token) {
            window.completeAuth(data);
        } else {
            alert(data.error || "Credenciales incorrectas");
        }
    } catch (err) {
        alert("Error al conectar con el servidor");
    }
};

window.handleRegister = async function() {
    const username = document.getElementById("reg-username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(`${window.API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await res.json();
        if (res.ok) {
            alert("¡Cuenta creada!");
            window.completeAuth(data);
        } else {
            alert(data.error || "Error al registrar");
        }
    } catch (err) {
        alert("Error de conexión");
    }
};

window.checkSession = async function() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${window.API_URL}/auth/me`, {
            headers: window.getHeaders(),
        });

        if (res.ok) {
            const user = await res.json();
            window.completeAuth({ token, user });
        } else {
            localStorage.removeItem("token");
        }
    } catch (err) {
        localStorage.removeItem("token");
    }
};

window.handleLogout = function() {
    localStorage.removeItem("token");
    location.reload();
};