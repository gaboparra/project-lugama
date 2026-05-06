import mongoose from "mongoose";

const SongSchema = new mongoose.Schema(
  {
    deezerId: { type: Number, unique: true, required: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    previewUrl: { type: String, required: true },
    albumCover: { type: String, required: false },
    difficulty: { type: Number, default: 1 },
    genre: { type: String, default: "General", index: true },
  },
  { timestamps: true },
);

SongSchema.index({ title: "text", artist: "text" });

export default mongoose.model("Song", SongSchema);
