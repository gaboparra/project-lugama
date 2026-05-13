import mongoose from "mongoose";

const SongSchema = new mongoose.Schema(
  {
    // Deezer
    deezerId: { type: Number, unique: true, required: true },
    previewUrl: { type: String, required: true },

    // Spotify metadata
    spotifyId: { type: String, sparse: true },
    albumName: { type: String },
    releaseDate: { type: String },
    durationMs: { type: Number },
    popularity: { type: Number, default: 0 }, // 0-100

    // Campos base
    title: { type: String, required: true },
    artist: { type: String, required: true },
    albumCover: { type: String },
    difficulty: { type: Number, default: null }, // null = usar popularity automático
    genre: { type: String, default: "General", index: true },
  },
  { timestamps: true },
);

SongSchema.index({ title: "text", artist: "text" });

// Dificultad efectiva: manual si está seteada, si no se deriva de popularity
SongSchema.virtual("effectiveDifficulty").get(function () {
  if (this.difficulty !== null && this.difficulty !== undefined)
    return this.difficulty;
  if (this.popularity >= 75) return 1; // muy popular = fácil
  if (this.popularity >= 50) return 2;
  if (this.popularity >= 25) return 3;
  return 4; // poco conocida = difícil
});

export default mongoose.model("Song", SongSchema);
