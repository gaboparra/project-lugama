import * as songService from "../services/song.service.js";

export const addSong = async (req, res) => {
  try {
    const song = await songService.createSong(req.body);
    res.status(201).json({ message: "Song saved successfully", song });
  } catch (error) {
    res.status(500).json({ error: "Error saving the song", details: error.message });
  }
};

export const getAllSongs = async (req, res) => {
  try {
    const songs = await songService.getAllSongs();
    res.json(songs);
  } catch {
    res.status(500).json({ error: "Error fetching songs" });
  }
};

export const updateSong = async (req, res) => {
  try {
    const song = await songService.updateSong(req.params.id, req.body);
    res.json({ message: "Song updated", song });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const deleteSong = async (req, res) => {
  try {
    await songService.deleteSong(req.params.id);
    res.json({ message: "Song deleted successfully" });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const getRandomSong = async (req, res) => {
  try {
    // género y dificultad opcionales: /api/songs/random?genre=Rock Argentino&difficulty=2
    const { genre, difficulty } = req.query;
    const song = await songService.getRandomSong(
      genre,
      difficulty ? parseInt(difficulty) : null,
    );
    res.json(song);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const validateAnswer = async (req, res) => {
  try {
    const result = await songService.validateAnswer({
      ...req.body,
      userId: req.user.id,
    });
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const searchSongsInDb = async (req, res) => {
  try {
    const songs = await songService.searchSongsInDb(req.query.q);
    res.json(songs);
  } catch {
    res.status(500).json({ error: "Search error" });
  }
};

export const searchExternalSong = async (req, res) => {
  try {
    if (!req.query.query)
      return res.status(400).json({ error: "Search term required" });
    const songs = await songService.searchExternal(req.query.query);
    res.json(songs);
  } catch {
    res.status(500).json({ error: "Error connecting to external API" });
  }
};

export const seedDatabase = async (req, res) => {
  try {
    const { artists, genre } = req.body;
    if (!Array.isArray(artists) || artists.length === 0) {
      return res.status(400).json({ error: "You must send an array of artists and a genre" });
    }
    const result = await songService.seedSongs({ artists, genre });
    res.json({ status: "Process completed", ...result });
  } catch (error) {
    res.status(500).json({ error: "Error in mass seeding", details: error.message });
  }
};

export const getExistingGenres = async (req, res) => {
  try {
    const genres = await songService.getGenres();
    res.json(genres);
  } catch (error) {
    res.status(500).json({ error: "Error fetching genres" });
  }
};
