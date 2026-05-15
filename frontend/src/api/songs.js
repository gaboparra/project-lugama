import api from "./axios";

export const getRandomSong = async (genre, difficulty) => {
  const params = {};

  if (genre) params.genre = genre;
  if (difficulty) params.difficulty = difficulty;

  const { data } = await api.get("/songs/random", {
    params,
  });

  return data;
};

export const validateAnswer = async (songId, answer, attempt) => {
  const { data } = await api.post("/songs/validate", {
    songId,
    answer,
    attempt,
  });

  return data;
};

export const searchSongs = async (q) => {
  const { data } = await api.get("/songs/search", {
    params: { q },
  });

  return data;
};

export const getGenres = async () => {
  const { data } = await api.get("/songs/genres");

  return data;
};
