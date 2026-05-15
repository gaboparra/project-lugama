import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/img/lgm-icon-removebg-preview.png'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ERROR_MESSAGES = {
  'Invalid credentials':          'Email o contraseña incorrectos',
  'User or email already in use': 'El usuario o email ya están en uso',
}

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
    if (isRegister && !form.username)                              return 'Completá todos los campos'
    if (!form.email || !form.password)                            return 'Completá todos los campos'
    if (isRegister && (form.username.length < 1 || form.username.length > 30))
                                                                   return 'El usuario tiene que tener entre 1 y 30 caracteres'
    if (!EMAIL_REGEX.test(form.email))                            return 'El email no tiene un formato válido'
    if (isRegister && form.password.length < 6)                   return 'La contraseña tiene que tener al menos 6 caracteres'
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
      setError(ERROR_MESSAGES[e.message] ?? e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit() }

  const toggleMode = () => {
    setIsRegister(v => !v)
    setError('')
    setForm({ username: '', email: '', password: '' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm flex flex-col items-center gap-3 p-10 rounded-2xl">

        <img src={logo} alt="Lugama" className="w-36 mb-1" />

        <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
          {isRegister ? 'Registro' : 'Login'}
        </h1>

        {isRegister && (
          <input
            className="input-auth"
            name="username" value={form.username}
            onChange={handleChange} onKeyDown={handleKeyDown}
            placeholder="Nombre de usuario"
          />
        )}

        <input
          className="input-auth"
          name="email" type="email" value={form.email}
          onChange={handleChange} onKeyDown={handleKeyDown}
          placeholder="Email"
        />

        <input
          className="input-auth"
          name="password" type="password" value={form.password}
          onChange={handleChange} onKeyDown={handleKeyDown}
          placeholder="Contraseña"
        />

        {error && <p className="feedback-error">{error}</p>}

        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Entrar'}
        </button>

        {!isRegister && <GoogleButton onLogin={loginWithGoogle} onError={setError} />}

        <p className="text-xs text-center text-muted mt-1">
          {isRegister ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
          <button
            onClick={toggleMode}
            className="text-purple-h hover:underline bg-transparent border-none p-0 text-xs cursor-pointer"
          >
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