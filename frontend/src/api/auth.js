const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export const loginUser = async (email, password) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')
  return data
}

export const registerUser = async (username, email, password) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al registrar')
  return data
}

export const googleLogin = async (idToken) => {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error con Google')
  return data
}

export const getProfile = async () => {
  const res = await fetch('/api/auth/me', { headers: getHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al obtener perfil')
  return data
}