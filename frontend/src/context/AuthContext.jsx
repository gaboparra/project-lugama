import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getProfile, loginUser, registerUser, googleLogin } from "../api/auth";

import fondoCoraje from "../assets/backgrounds/fondo-coraje.png";
import fondoGengar from "../assets/backgrounds/fondo-gengar.png";
import gengarsF from "../assets/backgrounds/gengars-fondo.png";
import gomuGomu from "../assets/backgrounds/gomu-gomu-expanded.png";
import purpleCity from "../assets/backgrounds/purple-city-expanded.png";

const BACKGROUNDS = [fondoCoraje, fondoGengar, gengarsF, gomuGomu, purpleCity];

const AuthContext = createContext(null);

const randomBackground = () =>
  BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];

const saveToken = (token) => localStorage.setItem("token", token);
const clearToken = () => localStorage.removeItem("token");

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--fondo-bg",
      `url('${randomBackground()}')`,
    );
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    getProfile()
      .then(setUser)
      .catch(clearToken)
      .finally(() => setLoading(false));
  }, []);

  const completeLogin = async (token) => {
    saveToken(token);
    const profile = await getProfile();
    setUser(profile);
  };

  const login = async (email, password) => {
    const { token } = await loginUser(email, password);
    await completeLogin(token);
  };

  const register = async (username, email, password) => {
    const { token } = await registerUser(username, email, password);
    await completeLogin(token);
  };

  const loginWithGoogle = async (idToken) => {
    const { token } = await googleLogin(idToken);
    await completeLogin(token);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const updateUser = useCallback((updates) => {
    setUser((u) => ({ ...u, ...updates }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
