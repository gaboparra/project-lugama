import axios from "axios";
import Song from "../models/Song.js";
import User from "../models/User.js";

export const addSong = async (req, res) => {
  try {
    const { title, artist, previewUrl, albumCover, difficulty, genre } = req.body;

    const newSong = new Song({
      title,
      artist,
      previewUrl,
      albumCover,
      difficulty,
      genre: genre || "General",
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
    const { genre } = req.query; // Ejemplo: /random?genre=Rock
    let filter = {};

    if (genre) {
      filter.genre = genre;
    }

    const count = await Song.countDocuments(filter);
    if (count === 0)
      return res.status(404).json({ error: "No hay canciones cargadas para este género" });

    const random = Math.floor(Math.random() * count);
    const song = await Song.findOne(filter).skip(random);

    try {
      const searchResponse = await axios.get(
        `https://api.deezer.com/search?q=track:"${encodeURIComponent(song.title)}" artist:"${encodeURIComponent(song.artist)}"`,
      );
      const freshTrack = searchResponse.data.data[0];
      if (freshTrack && freshTrack.preview) {
        song.previewUrl = freshTrack.preview;
      }
    } catch (e) {
      console.log("URL de fallback usada.");
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
    if (!song) return res.status(404).json({ error: "Canción no encontrada" });

    const normalize = (text) => {
      return (text.toLowerCase()
          // Elimina contenido entre paréntesis o corchetes (ej: "Song (Remastered)" = "Song")
          .replace(/\(.*\)|\[.*\]/g, "")
          // Toma solo lo que está antes de un guion (ej: "Song - Live" = "Song")
          .split("-")[0]
          // Elimina tildes para que "fuería" y "fueria" coincidan
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
      );
    };

    const cleanDbTitle = normalize(song.title);
    const cleanUserAnswer = normalize(answer);

    const isCorrect = cleanDbTitle === cleanUserAnswer;

    if (isCorrect) {
      // Intento 1 = 6 pts, Intento 6 = 1 pt.
      const pointsToSum = Math.max(7 - attempt, 1);

      const updateData = { $inc: { points: pointsToSum } };
      // Si es el primer intento, sumamos una estrella
      if (attempt === 1) {
        updateData.$inc.stars = 1;
      }

      const user = await User.findByIdAndUpdate(userId, updateData, {
        returnDocument: "after",
      }).select("-password");

      return res.json({
        correct: true,
        pointsEarned: pointsToSum,
        starEarned: attempt === 1,
        totalPoints: user.points,
        totalStars: user.stars,
        fullData: song,
      });
    }

    if (attempt >= 6) {
      return res.json({
        correct: false,
        message: "Perdiste, se agotaron los intentos",
        fullData: song,
      });
    }

    res.json({ correct: false, message: "Incorrecto, intenta de nuevo" });
  } catch (error) {
    res.status(500).json({ error: "Error en la validación" });
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
    })
      // 'locale: en' y 'strength: 1' para ignorar tildes y mayúsculas
      .collation({ locale: "en", strength: 1 })
      .limit(50);

    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: "Error en la búsqueda" });
  }
};

export const seedDatabase = async (req, res) => {
  const { artists, genre } = req.body;

  if (!artists || !Array.isArray(artists) || artists.length === 0) {
    return res.status(400).json({ error: "Envía un array de artistas y un género." });
  }

  let addedCount = 0;
  let skippedCount = 0;
  let noPreviewCount = 0;

  try {
    for (const artistQuery of artists) {
      const response = await axios.get(
        `https://api.deezer.com/search?q=${encodeURIComponent(artistQuery)}&limit=50`,
      );

      const tracks = response.data.data;
      if (!tracks || tracks.length === 0) continue;

      for (const track of tracks) {
        if (!track.preview) {
          noPreviewCount++;
          continue;
        }

        const exists = await Song.findOne({ deezerId: track.id });

        if (!exists) {
          await Song.create({
            deezerId: track.id,
            title: track.title,
            artist: track.artist.name,
            previewUrl: track.preview,
            albumCover: track.album.cover_medium,
            difficulty: 1,
            genre: genre || "General",
          });
          addedCount++;
        } else {
          exists.previewUrl = track.preview;
          await exists.save();
          skippedCount++;
        }
      }
    }

    res.json({
      status: "Process completed",
      genre_added: genre || "General",
      new_songs: addedCount,
      updated_or_skipped: skippedCount,
      ignored_no_preview: noPreviewCount,
      total_in_db: await Song.countDocuments(),
    });
  } catch (error) {
    res.status(500).json({ error: "Error in mass seeding", details: error.message });
  }
};

export const getExistingGenres = async (req, res) => {
  try {
    const genres = await Song.distinct("genre");
    res.json(genres);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener géneros" });
  }
};
