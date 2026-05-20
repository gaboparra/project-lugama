import axios from "axios";
import Challenge from "../models/Challenge.js";
import Song from "../models/Song.js";
import User from "../models/User.js";
import { normalizeText } from "../utils/normalizeSong.js";

const MAX_PLAYERS = 4;

// ── Helper: refrescar previewUrl desde Deezer ─────────────────────────────────

const refreshPreviewUrl = async (song) => {
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

// ── Crear desafío ─────────────────────────────────────────────────────────────

export const createChallenge = async ({
  userId,
  genre,
  difficulty,
  artist,
  maxPlayers,
}) => {
  const filter = {};
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

  // Buscar datos del creador para el auto-join
  const creator = await User.findById(userId);

  const challenge = await Challenge.create({
    songId: song._id,
    genre: genre || null,
    difficulty: difficulty || null,
    artist: artist || null,
    createdBy: userId,
    maxPlayers:
      maxPlayers && maxPlayers >= 2 && maxPlayers <= 4
        ? maxPlayers
        : MAX_PLAYERS,
    // El creador se une automáticamente al lobby
    players: [
      {
        userId,
        username: creator.username,
        status: "joined",
      },
    ],
  });

  return { code: challenge.code, expiresAt: challenge.expiresAt };
};

// ── Unirse al lobby ───────────────────────────────────────────────────────────

export const joinChallenge = async (code, userId) => {
  const challenge = await Challenge.findOne({ code });

  if (!challenge)
    throw Object.assign(new Error("Challenge not found"), { status: 404 });

  if (new Date() > challenge.expiresAt)
    throw Object.assign(new Error("This challenge has expired"), {
      status: 410,
    });

  // Ya está en el lobby (joined o played)
  const alreadyIn = challenge.players.some(
    (p) => p.userId.toString() === userId,
  );
  if (alreadyIn)
    throw Object.assign(new Error("You already joined this challenge"), {
      status: 400,
    });

  // Sala llena
  if (challenge.players.length >= challenge.maxPlayers)
    throw Object.assign(new Error("This challenge is full"), { status: 400 });

  const user = await User.findById(userId);
  challenge.players.push({ userId, username: user.username, status: "joined" });
  await challenge.save();

  return {
    code: challenge.code,
    genre: challenge.genre,
    difficulty: challenge.difficulty,
    artist: challenge.artist,
    maxPlayers: challenge.maxPlayers,
    expiresAt: challenge.expiresAt,
    players: challenge.players,
  };
};

// ── Obtener desafío ───────────────────────────────────────────────────────────

export const getChallenge = async (code, userId) => {
  const challenge = await Challenge.findOne({ code }).populate("songId");

  if (!challenge)
    throw Object.assign(new Error("Challenge not found"), { status: 404 });

  if (new Date() > challenge.expiresAt)
    throw Object.assign(new Error("This challenge has expired"), {
      status: 410,
    });

  const playerEntry = challenge.players.find(
    (p) => p.userId.toString() === userId,
  );
  const alreadyPlayed = playerEntry?.status === "played";
  const alreadyJoined = !!playerEntry;

  const song = await refreshPreviewUrl(challenge.songId);

  return {
    code: challenge.code,
    genre: challenge.genre,
    difficulty: challenge.difficulty,
    artist: challenge.artist,
    maxPlayers: challenge.maxPlayers,
    expiresAt: challenge.expiresAt,
    alreadyJoined,
    alreadyPlayed,
    players: challenge.players,
    // Canción completa si ya jugó, solo previewUrl si solo se unió o no jugó aún
    song: alreadyPlayed
      ? song
      : {
          _id: song._id,
          previewUrl: song.previewUrl,
        },
  };
};

// ── Validar respuesta del desafío ─────────────────────────────────────────────

export const validateChallengeAnswer = async ({
  code,
  answer,
  attempt,
  userId,
}) => {
  const challenge = await Challenge.findOne({ code }).populate("songId");

  if (!challenge)
    throw Object.assign(new Error("Challenge not found"), { status: 404 });

  if (new Date() > challenge.expiresAt)
    throw Object.assign(new Error("This challenge has expired"), {
      status: 410,
    });

  const playerEntry = challenge.players.find(
    (p) => p.userId.toString() === userId,
  );

  // Debe haberse unido antes de jugar
  if (!playerEntry)
    throw Object.assign(
      new Error("You must join the challenge before playing"),
      { status: 400 },
    );

  // Ya jugó
  if (playerEntry.status === "played")
    throw Object.assign(new Error("You already played this challenge"), {
      status: 400,
    });

  const song = await refreshPreviewUrl(challenge.songId);
  const isCorrect = normalizeText(song.title) === normalizeText(answer);

  if (isCorrect) {
    const pointsEarned = Math.max(7 - attempt, 1);

    playerEntry.status = "played";
    playerEntry.attempts = attempt;
    playerEntry.points = pointsEarned;
    playerEntry.correct = true;
    playerEntry.playedAt = new Date();
    await challenge.save();

    const update = { $inc: { points: pointsEarned } };
    if (attempt === 1) update.$inc.stars = 1;
    const updatedUser = await User.findByIdAndUpdate(userId, update, {
      new: true,
    }).select("-password");

    return {
      correct: true,
      pointsEarned,
      starEarned: attempt === 1,
      totalPoints: updatedUser.points,
      totalStars: updatedUser.stars,
      fullData: song,
      players: challenge.players,
    };
  }

  if (attempt >= 6) {
    playerEntry.status = "played";
    playerEntry.attempts = 6;
    playerEntry.points = 0;
    playerEntry.correct = false;
    playerEntry.playedAt = new Date();
    await challenge.save();

    return {
      correct: false,
      message: "Attempts exhausted",
      fullData: song,
      players: challenge.players,
    };
  }

  return { correct: false, message: "Wrong answer" };
};

// ── Resultados finales ────────────────────────────────────────────────────────

export const getChallengeResults = async (code) => {
  const challenge = await Challenge.findOne({ code }).populate("songId");

  if (!challenge)
    throw Object.assign(new Error("Challenge not found"), { status: 404 });

  const sorted = [...challenge.players].sort((a, b) => b.points - a.points);

  return {
    code: challenge.code,
    song: challenge.songId,
    genre: challenge.genre,
    expiresAt: challenge.expiresAt,
    players: sorted,
  };
};
