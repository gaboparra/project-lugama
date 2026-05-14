import mongoose from "mongoose";

const SongSchema = new mongoose.Schema(
  {
    // Deezer
    deezerId: { type: Number, unique: true, required: true },
    previewUrl: { type: String, required: true },

    // Last.fm + metadata
    playcount: { type: Number, default: 0 }, // reproducciones reales
    popularity: { type: Number, default: 0 }, // 0-100, normalizado de playcount
    albumName: { type: String },
    durationMs: { type: Number },

    // Campos base
    title: { type: String, required: true },
    artist: { type: String, required: true },
    albumCover: { type: String },
    difficulty: { type: Number, default: null }, // null = automático via popularity
    genre: { type: String, default: "General", index: true },
  },
  { timestamps: true },
);

SongSchema.index({ title: "text", artist: "text" });

// Manual si está seteada, si no se deriva de popularity
// 1 = fácil (muy popular), 4 = difícil (poco conocida)
SongSchema.virtual("effectiveDifficulty").get(function () {
  if (this.difficulty !== null && this.difficulty !== undefined)
    return this.difficulty;
  if (this.popularity >= 75) return 1;
  if (this.popularity >= 50) return 2;
  if (this.popularity >= 25) return 3;
  return 4;
});

export default mongoose.model("Song", SongSchema);
