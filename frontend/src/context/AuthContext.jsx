import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getProfile, loginUser, registerUser, googleLogin } from '../api/auth'

// Vite requiere importar los assets estáticos explícitamente
import fondoCoraje   from '../assets/backgrounds/fondo-coraje.png'
import fondoGengar   from '../assets/backgrounds/fondo-gengar.png'
import gengarsF      from '../assets/backgrounds/gengars-fondo.png'
import gomuGomu      from '../assets/backgrounds/gomu-gomu-expanded.png'
import purpleCity    from '../assets/backgrounds/purple-city-expanded.png'

const BACKGROUNDS = [fondoCoraje, fondoGengar, gengarsF, gomuGomu, purpleCity]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Fondo aleatorio al montar
  useEffect(() => {
    const fondo = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]
    document.documentElement.style.setProperty('--fondo-bg', `url('${fondo}')`)
  }, [])

  // Verificar sesión al cargar
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    getProfile()
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await loginUser(email, password)
    localStorage.setItem('token', data.token)
    const profile = await getProfile()
    setUser(profile)
  }

  const register = async (username, email, password) => {
    const data = await registerUser(username, email, password)
    localStorage.setItem('token', data.token)
    const profile = await getProfile()
    setUser(profile)
  }

  const loginWithGoogle = async (idToken) => {
    const data = await googleLogin(idToken)
    localStorage.setItem('token', data.token)
    const profile = await getProfile()
    setUser(profile)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const updateUser = useCallback((updates) => {
    setUser(u => ({ ...u, ...updates }))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)