import axios from "axios";
import Song from "../models/Song.js";
import User from "../models/User.js";
import { normalizeText } from "../utils/normalizeSong.js";
import { getLastfmData } from "./lastfm.service.js";

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Filtro de versiones alternativas ─────────────────────────────────────────

const ALTERNATIVE_VERSION_KEYWORDS = [
  // Remasters
  // "remaster",
  // "remastered",
  // "remasterizado", (Muy agresivos, a menudo el mismo título con diferente capitalización)
  // En vivo
  "live",
  "en vivo",
  "vivo",
  "directo",
  "en directo",
  "gira",
  "tour",
  "concert",
  // Versiones alternativas de estudio
  "acoustic",
  "acústico",
  "acustico",
  "unplugged",
  "demo",
  "outtake",
  "instrumental",
  "karaoke",
  // Ediciones de radio/single
  "radio edit",
  "single version",
  "mono version",
  "stereo version",
  "original mix",
  // Ediciones especiales
  "bonus track",
  "anniversary edition",
  // Otras
  // 'remix'    → puede ser canción famosa por sí sola
  // 'edit'     → muy genérico, puede aparecer en títulos normales
  // 'version'  → demasiado amplio, "La Versión de Rodrigo" sería filtrada
  // 'versión'  → ídem
  // 'deluxe'   → aparece más en álbumes que en tracks
  // 'extended' → hay extended mixes que son conocidos
  // 'bonus'    → muy genérico
  // 'release'  → puede aparecer en cualquier contexto
  // 'album version' → en realidad ES la versión original en muchos casos
];

const isAlternativeVersion = (title) => {
  const lower = title.toLowerCase();
  return ALTERNATIVE_VERSION_KEYWORDS.some((kw) => lower.includes(kw));
};

// ── Popularidad relativa por género ───────────────────────────────────────────

const recalculatePopularityByGenre = async (genre) => {
  const songs = await Song.find({ genre }).select("_id playcount");
  if (songs.length === 0) return;

  const sorted = songs.map((s) => s.playcount).sort((a, b) => a - b);
  const p95Index = Math.floor(sorted.length * 0.95);
  const cap = sorted[p95Index] || sorted[sorted.length - 1] || 1;

  const bulkOps = songs.map((song) => ({
    updateOne: {
      filter: { _id: song._id },
      update: {
        $set: {
          popularity: Math.min(Math.round((song.playcount / cap) * 100), 100),
        },
      },
    },
  }));

  await Song.bulkWrite(bulkOps);
  console.log(
    `Popularity recalculada para ${songs.length} canciones de "${genre}" (cap: ${cap.toLocaleString()} plays)`,
  );
};

// ── Seed ──────────────────────────────────────────────────────────────────────

const fetchAllDeezerTracks = async (artistQuery) => {
  const allTracks = [];
  let index = 0;

  while (true) {
    const response = await axios.get(
      `https://api.deezer.com/search?q=artist:"${encodeURIComponent(artistQuery)}"&limit=100&index=${index}`,
    );
    const tracks = response.data.data || [];
    allTracks.push(...tracks);

    if (tracks.length < 100) break;

    index += 100;
    // await sleep(100);
  }

  return allTracks;
};

export const seedSongs = async ({ artists, genre }) => {
  let added = 0,
    skipped = 0,
    noPreview = 0,
    filtered = 0;

  const lastfmCache = new Map();

  for (const artistQuery of artists) {
    const tracks = await fetchAllDeezerTracks(artistQuery);

    for (const track of tracks) {
      if (!track.preview) {
        noPreview++;
        continue;
      }

      if (track.artist.name.toLowerCase() !== artistQuery.toLowerCase())
        continue;

      // Filtrar versiones alternativas
      if (isAlternativeVersion(track.title)) {
        console.log(`FILTERED: ${track.title}`); // temporal
        filtered++;
        continue;
      }

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

      const cacheKey = `${track.title}-${track.artist.name}`;
      if (!lastfmCache.has(cacheKey)) {
        const result = await getLastfmData(track.title, track.artist.name);
        lastfmCache.set(cacheKey, result);
        // await sleep(100);
      }
      const lastfmData = lastfmCache.get(cacheKey);

      await Song.create({
        deezerId: track.id,
        title: track.title,
        artist: track.artist.name,
        previewUrl: track.preview,
        albumCover: track.album?.cover_medium || "",
        genre: genre || "General",
        difficulty: null,
        playcount: lastfmData?.playcount ?? 0,
        popularity: 0,
        durationMs: lastfmData?.durationMs ?? null,
        albumName: lastfmData?.albumName || null,
      });
      added++;
    }
  }

  await recalculatePopularityByGenre(genre || "General");

  return {
    genre_added: genre || "General",
    new_songs: added,
    skipped,
    filtered_alt_versions: filtered,
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

export const getRandomSong = async (genre, difficulty, artist) => {
  const filter = {};

  // Todos los parámetros son opcionales e independientes entre sí
  if (genre) filter.genre = genre;
  if (artist) filter.artist = { $regex: `^${artist}$`, $options: "i" };
  if (difficulty) {
    const ranges = {
      1: { $gte: 75 },
      2: { $gte: 50, $lt: 75 },
      3: { $gte: 25, $lt: 50 },
      4: { $lt: 25 },
    };
    if (ranges[difficulty]) filter.popularity = ranges[difficulty];
  }

  const count = await Song.countDocuments(filter);
  if (count === 0)
    throw Object.assign(
      new Error("No songs found for this filter combination"),
      { status: 404 },
    );

  const song = await Song.findOne(filter).skip(
    Math.floor(Math.random() * count),
  );

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
      returnDocument: "after",
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

  const results = await Song.aggregate([
    {
      $search: {
        index: "default",
        compound: {
          should: [
            {
              text: {
                query: q,
                path: ["title", "artist"],
                fuzzy: { maxEdits: 1 },
              },
            },
            {
              autocomplete: {
                query: q,
                path: "title",
              },
            },
            {
              autocomplete: {
                query: q,
                path: "artist",
              },
            },
          ],
        },
      },
    },
    { $limit: 50 },
    {
      $project: {
        _id: 1,
        title: 1,
        artist: 1,
        genre: 1,
        albumCover: 1,
      },
    },
  ]);

  return results;
};

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

export const getArtists = async () => Song.distinct("artist");
