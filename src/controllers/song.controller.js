import axios from "axios";
import Song from "../models/Song.js";
import User from "../models/User.js";
import { normalizeText } from "../utils/normalizeSong.js";

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
      return res.status(404).json({ error: "There are no loaded songs for this genre" });

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
      console.log("used fallback URL.");
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

    if (!song) {
      return res.status(404).json({
        error: "Song not found",
      });
    }

    const cleanDbTitle = normalizeText(song.title);
    const cleanUserAnswer = normalizeText(answer);

    const isCorrect = cleanDbTitle === cleanUserAnswer;

    if (isCorrect) {
      const pointsToSum = Math.max(7 - attempt, 1);

      const updateData = {
        $inc: { points: pointsToSum },
      };

      if (attempt === 1) {
        updateData.$inc.stars = 1;
      }

      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
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
        message: "You lost, attempts exhausted",
        fullData: song,
      });
    }

    res.json({
      correct: false,
      message: "Wrong answer",
    });
  } catch (error) {
    res.status(500).json({
      error: "Validation error",
    });
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
      .limit(15);

    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: "Search error" });
  }
};

export const seedDatabase = async (req, res) => {
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const { artists, genre } = req.body;

  if (!artists || !Array.isArray(artists) || artists.length === 0) {
    return res.status(400).json({ error: "You must send an array of artists and a genre" });
  }

  let addedCount = 0;
  let skippedCount = 0;
  let noPreviewCount = 0;

  try {
    for (const artistQuery of artists) {
      const response = await axios.get(
        `https://api.deezer.com/search?q=artist:"${encodeURIComponent(artistQuery)}"&limit=50`,
      );

      const tracks = response.data.data;
      if (!tracks || tracks.length === 0) continue;

      for (const track of tracks) {
        if (!track.preview) {
          noPreviewCount++;
          continue;
        }

        if (track.artist.name.toLowerCase() !== artistQuery.toLowerCase()) {
          continue;
        }

        const escapedTitle = escapeRegExp(track.title);

        const isDuplicateTitle = await Song.findOne({
          title: { $regex: `^${escapedTitle}$`, $options: "i" },
          artist: track.artist.name,
        });

        if (isDuplicateTitle) {
          skippedCount++;
          continue;
        }

        const existsById = await Song.findOne({ deezerId: track.id });

        if (!existsById) {
          await Song.create({
            deezerId: track.id,
            title: track.title,
            artist: track.artist.name,
            previewUrl: track.preview,
            albumCover: track.album && track.album.cover_medium
                ? track.album.cover_medium
                : "",
            difficulty: 1,
            genre: genre || "General",
          });
          addedCount++;
        } else {
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
    res.status(500).json({ error: "Error fetching genres" });
  }
};
