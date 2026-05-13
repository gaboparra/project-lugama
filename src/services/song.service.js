import axios from "axios";
import Song from "../models/Song.js";
import User from "../models/User.js";
import { normalizeText } from "../utils/normalizeSong.js";
import { searchSpotifyTrack } from "./spotify.service.js";

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Seed ──────────────────────────────────────────────────────────────────────

export const seedSongs = async ({ artists, genre }) => {
  let added = 0, skipped = 0, noPreview = 0;

  const spotifyCache = new Map();

  for (const artistQuery of artists) {
    const response = await axios.get(
      `https://api.deezer.com/search?q=artist:"${encodeURIComponent(artistQuery)}"&limit=50`,
    );
    const tracks = response.data.data || [];

    for (const track of tracks) {
      if (!track.preview) {
        noPreview++;
        continue;
      }

      if (track.artist.name.toLowerCase() !== artistQuery.toLowerCase())
        continue;

      const escaped = escapeRegExp(track.title);
      const duplicate = await Song.findOne({
        title: { $regex: `^${escaped}$`, $options: "i" },
        artist: track.artist.name,
      });
      if (duplicate) {
        skipped++;
        continue;
      }

      const existsById = await Song.findOne({ deezerId: track.id });
      if (existsById) {
        skipped++;
        continue;
      }

      // Cache con has() para manejar correctamente valores null
      const cacheKey = `${track.title}-${track.artist.name}`;
      if (!spotifyCache.has(cacheKey)) {
        const result = await searchSpotifyTrack(track.title, track.artist.name);
        spotifyCache.set(cacheKey, result); // null también queda cacheado
        await sleep(500);
      }
      const spotifyData = spotifyCache.get(cacheKey);

      await Song.create({
        deezerId: track.id,
        title: track.title,
        artist: track.artist.name,
        previewUrl: track.preview,
        albumCover: spotifyData?.albumCover || track.album?.cover_medium || "",
        genre: genre || "General",
        difficulty: null,
        spotifyId: spotifyData?.spotifyId,
        albumName: spotifyData?.albumName,
        releaseDate: spotifyData?.releaseDate,
        durationMs: spotifyData?.durationMs,
        popularity: spotifyData?.popularity ?? 0,
      });
      added++;
    }
  }

  return {
    genre_added: genre || "General",
    new_songs: added,
    skipped,
    ignored_no_preview: noPreview,
    total_in_db: await Song.countDocuments(),
  };
};

// ── CRUD base ─────────────────────────────────────────────────────────────────

export const createSong = async (data) => {
  return Song.create(data);
};

export const getAllSongs = async () => {
  return Song.find();
};

export const updateSong = async (id, data) => {
  const song = await Song.findByIdAndUpdate(id, data, {
    returnDocument: "after",
  });
  if (!song) throw Object.assign(new Error("Song not found"), { status: 404 });
  return song;
};

export const deleteSong = async (id) => {
  const song = await Song.findByIdAndDelete(id);
  if (!song) throw Object.assign(new Error("Song not found"), { status: 404 });
  return song;
};

// ── Juego ─────────────────────────────────────────────────────────────────────

export const getRandomSong = async (genre) => {
  const filter = genre ? { genre } : {};
  const count = await Song.countDocuments(filter);
  if (count === 0)
    throw Object.assign(new Error("No songs for this genre"), { status: 404 });

  const song = await Song.findOne(filter).skip(
    Math.floor(Math.random() * count),
  );

  // Intentar refrescar la preview desde Deezer
  try {
    const response = await axios.get(
      `https://api.deezer.com/search?q=track:"${encodeURIComponent(song.title)}" artist:"${encodeURIComponent(song.artist)}"`,
    );
    const fresh = response.data.data[0];
    if (fresh?.preview) song.previewUrl = fresh.preview;
  } catch {
    console.log("Deezer refresh failed, using stored URL");
  }

  return song;
};

export const validateAnswer = async ({ songId, answer, attempt, userId }) => {
  const song = await Song.findById(songId);
  if (!song) throw Object.assign(new Error("Song not found"), { status: 404 });

  const isCorrect = normalizeText(song.title) === normalizeText(answer);

  if (isCorrect) {
    const pointsEarned = Math.max(7 - attempt, 1);
    const update = { $inc: { points: pointsEarned } };
    if (attempt === 1) update.$inc.stars = 1;

    const user = await User.findByIdAndUpdate(userId, update, {
      new: true,
    }).select("-password");

    return {
      correct: true,
      pointsEarned,
      starEarned: attempt === 1,
      totalPoints: user.points,
      totalStars: user.stars,
      fullData: song,
    };
  }

  if (attempt >= 6) {
    return { correct: false, message: "Attempts exhausted", fullData: song };
  }

  return { correct: false, message: "Wrong answer" };
};

export const searchSongsInDb = async (q) => {
  if (!q) return [];
  return Song.find({
    $or: [
      { title: { $regex: q, $options: "i" } },
      { artist: { $regex: q, $options: "i" } },
    ],
  })
    .collation({ locale: "en", strength: 1 })
    .limit(15);
};

// No devuelve nada si no encuentra resultados, en vez de lanzar error.
export const searchExternal = async (query) => {
  const response = await axios.get(
    `https://api.deezer.com/search?q=${encodeURIComponent(query)}`,
  );
  return response.data.data
    .filter((t) => t.preview?.includes("cdns-preview"))
    .map((t) => ({
      title: t.title,
      artist: t.artist.name,
      previewUrl: t.preview,
      albumCover: t.album.cover_medium,
    }));
};

export const getGenres = async () => {
  return Song.distinct("genre");
};
