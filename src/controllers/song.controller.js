import axios from "axios";
import Song from "../models/Song.js";
import User from "../models/User.js";

export const addSong = async (req, res) => {
  try {
    const { title, artist, previewUrl, albumCover, difficulty } = req.body;

    const newSong = new Song({
      title,
      artist,
      previewUrl,
      albumCover,
      difficulty,
    });
    const savedSong = await newSong.save();

    res.status(201).json({
      message: "Song saved successfully",
      song: savedSong,
    });
  } catch (error) {
    res.status(500).json({ error: "Error saving the song", details: error.message });
  }
};

export const getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: "Error fetching songs" });
  }
};

export const updateSong = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSong = await Song.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
    });

    if (!updatedSong) {
      return res.status(404).json({ error: "Song not found" });
    }

    res.json({ message: "Song updated", song: updatedSong });
  } catch (error) {
    res.status(500).json({ error: "Error updating", details: error.message });
  }
};

export const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSong = await Song.findByIdAndDelete(id);

    if (!deletedSong) {
      return res.status(404).json({ error: "Song not found to delete" });
    }

    res.json({ message: "Song deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting", details: error.message });
  }
};

export const getRandomSong = async (req, res) => {
  try {
    // Aggregate de Mongo para traer una muestra aleatoria de 1
    const count = await Song.countDocuments();
    const random = Math.floor(Math.random() * count);
    const song = await Song.findOne().skip(random);

    if (!song) {
      return res.status(404).json({ error: "No songs loaded" });
    }

    res.json(song);
  } catch (error) {
    res.status(500).json({ error: "Error getting random song" });
  }
};

export const validateAnswer = async (req, res) => {
  try {
    const { songId, answer, attempt } = req.body;
    const userId = req.user.id;

    const song = await Song.findById(songId);

    const isCorrect = song.title.toLowerCase().trim() === answer.toLowerCase().trim();

    if (isCorrect) {
      // Calculamos puntos: si es el primer intento (attempt=1) suma 10.
      // Si es el segundo, suma 8, etc.
      const pointsToSum = Math.max(10 - (attempt - 1) * 2, 2); // Mínimo 2 puntos por adivinar

      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { points: pointsToSum } },
        { returnDocument: "after" },
      );

      return res.json({
        correct: true,
        pointsEarned: pointsToSum,
        totalPoints: user.points,
        fullData: song,
      });
    }

    // Si falla, el Front se encarga de mostrar "Error, te quedan X intentos"
    // y en la próxima llamada mandará attempt: 2
    res.json({ correct: false, message: "Incorrect" });
  } catch (error) {
    res.status(500).json({ error: "Error in validation" });
  }
};

// Buscar canciones en la API de Deezer
export const searchExternalSong = async (req, res) => {
  try {
    const { query } = req.query; // Ejemplo: /search-external?query=skrillex
    if (!query) {
      return res.status(400).json({ error: "You must send a search term" });
    }

    const response = await axios.get(
      `https://api.deezer.com/search?q=${query}`,
    );

    // Mapeamos solo la data que nos sirve para nuestro modelo
    const songs = response.data.data
      .filter((song) => song.preview && song.preview.includes("cdns-preview"))
      .map((song) => ({
        title: song.title,
        artist: song.artist.name,
        previewUrl: song.preview,
        albumCover: song.album.cover_medium,
      }));

    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: "Error connecting to external API" });
  }
};

export const searchSongsInDb = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const songs = await Song.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { artist: { $regex: q, $options: "i" } },
      ],
    }).limit(50);

    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: "Error in the search" });
  }
};

export const seedDatabase = async (req, res) => {
  const { artists } = req.body;

  if (!artists || !Array.isArray(artists) || artists.length === 0) {
    return res.status(400).json({
      error:
        "Debes enviar un array de artistas en el cuerpo de la petición (JSON).",
    });
  }

  let addedCount = 0;
  let skippedCount = 0;

  try {
    for (const artistQuery of artists) {
      // Usamos encodeURIComponent para manejar espacios y tildes (ej: "Charly García")
      const response = await axios.get(
        `https://api.deezer.com/search?q=${encodeURIComponent(artistQuery)}&limit=50`,
      );

      const tracks = response.data.data;
      if (!tracks || tracks.length === 0) continue;

      for (const track of tracks) {
        // Validamos que exista una URL de audio, sin importar el subdominio
        if (!track.preview) continue;

        const exists = await Song.findOne({ previewUrl: track.preview });

        if (!exists) {
          await Song.create({
            title: track.title,
            artist: track.artist.name,
            previewUrl: track.preview,
            albumCover: track.album.cover_medium,
            difficulty: 1, // Por defecto dificultad 1
          });
          addedCount++;
        } else {
          skippedCount++;
        }
      }
    }

    res.json({
      status: "Process completed",
      new_songs: addedCount,
      skipped_due_to_duplicates: skippedCount,
      total_in_db: await Song.countDocuments(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Error in mass seeding",
      details: error.message,
    });
  }
};
