const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export const getRandomSong = async (genre) => {
  const url = genre ? `/api/songs/random?genre=${genre}` : '/api/songs/random'
  const res = await fetch(url, { headers: getHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al cargar canción')
  return data
}

export const validateAnswer = async (songId, answer, attempt) => {
  const res = await fetch('/api/songs/validate', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ songId, answer, attempt })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al validar')
  return data
}

export const searchSongs = async (q) => {
  const res = await fetch(`/api/songs/search?q=${q}`, { headers: getHeaders() })
  return res.json()
}

export const getGenres = async () => {
  const res = await fetch('/api/songs/genres', { headers: getHeaders() })
  return res.json()
}