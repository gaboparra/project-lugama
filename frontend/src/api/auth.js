import api from './axios'

export const loginUser = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export const registerUser = async (username, email, password) => {
  const { data } = await api.post('/auth/register', { username, email, password })
  return data
}

export const googleLogin = async (idToken) => {
  const { data } = await api.post('/auth/google', { idToken })
  return data
}

export const getProfile = async () => {
  const { data } = await api.get('/auth/me')
  return data
}