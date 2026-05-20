import mongoose from "mongoose";
import { nanoid } from "nanoid";

const PlayerResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: { type: String, required: true },
    status: { type: String, enum: ["joined", "played"], default: "joined" },
    attempts: { type: Number, default: null }, // null = no jugó aún
    points: { type: Number, default: 0 },
    correct: { type: Boolean, default: false },
    playedAt: { type: Date, default: null },
  },
  { _id: false },
);

const ChallengeSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, default: () => nanoid(8) },
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
    },
    genre: { type: String, default: null },
    difficulty: { type: Number, default: null },
    artist: { type: String, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    maxPlayers: { type: Number, default: 4, min: 2, max: 4 },
    players: { type: [PlayerResultSchema], default: [] },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true },
);

export default mongoose.model("Challenge", ChallengeSchema);
