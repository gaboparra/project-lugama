import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/img/lgm-icon-removebg-preview.png'

export default function LoginPage() {
  const { login, register, loginWithGoogle } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm]             = useState({ username: '', email: '', password: '' })
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const validate = () => {
    if (isRegister && !form.username) return 'Completá todos los campos'
    if (!form.email || !form.password) return 'Completá todos los campos'
    if (isRegister && (form.username.length < 1 || form.username.length > 30))
      return 'El usuario tiene que tener entre 1 y 30 caracteres'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'El email no tiene un formato válido'
    if (isRegister && form.password.length < 6)
      return 'La contraseña tiene que tener al menos 6 caracteres'
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    try {
      if (isRegister) await register(form.username, form.email, form.password)
      else            await login(form.email, form.password)
    } catch (e) {
      setError(
        e.message === 'Invalid credentials'         ? 'Email o contraseña incorrectos' :
        e.message === 'User or email already in use' ? 'El usuario o email ya están en uso' :
        e.message
      )
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit() }

  const toggle = () => {
    setIsRegister(!isRegister)
    setError('')
    setForm({ username: '', email: '', password: '' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        className="w-full max-w-sm rounded-2xl p-10 flex flex-col items-center gap-3">

        <img src={logo} alt="Lugama" className="w-36 mb-1" />
        <h1 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--white)' }}
          className="text-xl font-bold mb-1">
          {isRegister ? 'Registro' : 'Login'}
        </h1>

        {isRegister && (
          <input
            name="username" value={form.username} onChange={handleChange} onKeyDown={handleKeyDown}
            placeholder="Nombre de usuario"
            style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', color: 'var(--white)' }}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 placeholder:text-gray-500"
          />
        )}

        <input
          name="email" type="email" value={form.email} onChange={handleChange} onKeyDown={handleKeyDown}
          placeholder="Email"
          style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', color: 'var(--white)' }}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 placeholder:text-gray-500"
        />

        <input
          name="password" type="password" value={form.password} onChange={handleChange} onKeyDown={handleKeyDown}
          placeholder="Contraseña"
          style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', color: 'var(--white)' }}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 placeholder:text-gray-500"
        />

        {error && (
          <p style={{ background: '#2d1a1a', border: '1px solid #8b2222', color: '#cf7a7a' }}
            className="w-full rounded-lg px-4 py-2 text-xs text-center">
            {error}
          </p>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{ background: 'var(--purple)' }}
          className="w-full py-3 rounded-xl text-white text-sm font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
          {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Entrar'}
        </button>

        {!isRegister && (
          <GoogleButton onLogin={loginWithGoogle} onError={setError} />
        )}

        <p style={{ color: 'var(--muted)' }} className="text-xs text-center mt-1">
          {isRegister ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
          <button onClick={toggle} style={{ color: 'var(--purple-h)' }} className="hover:underline bg-transparent border-none p-0 text-xs cursor-pointer">
            {isRegister ? 'Logueate' : 'Registrate acá'}
          </button>
        </p>
      </div>
    </div>
  )
}

function GoogleButton({ onLogin, onError }) {
  useEffect(() => {
    if (!window.google) return
    window.google.accounts.id.initialize({
      client_id: '766669482921-06i6pn5nn4ig0f3ba6djp6l7q63aahur.apps.googleusercontent.com',
      callback: async (response) => {
        try { await onLogin(response.credential) }
        catch (e) { onError(e.message) }
      }
    })
    window.google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'filled_black', size: 'large', width: 280 }
    )
  }, [])

  return <div id="google-btn" className="mt-1" />
}