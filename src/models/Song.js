import mongoose from "mongoose";

const SongSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    previewUrl: { type: String, required: true },
    albumCover: { type: String, required: true },
    difficulty: { type: Number, default: 1 },
  },
  { timestamps: true },
); // Agrega fecha de creación y actualización automáticamente

export default mongoose.model("Song", SongSchema);
