// import mongoose from "mongoose";

// const RARITIES = ["common", "rare", "epic", "legendary"];
// const GENRES = [
//   "Rock Internacional",
//   "Rock Argentino",
//   "Pop",
//   "Electrónica",
//   "Hip-Hop",
//   "Reggaeton",
//   "Trap",
//   "K-Pop",
//   "Metal",
//   "Jazz",
//   "Cumbia",
//   "Legends",
// ];

// const StickerSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     genre: {
//       type: String,
//       required: true,
//       enum: GENRES,
//       index: true,
//     },
//     rarity: {
//       type: String,
//       required: true,
//       enum: RARITIES,
//       index: true,
//     },
//     imageUrl: {
//       type: String,
//       required: true,
//     },
//     // Info extra para mostrar en la figurita
//     bio: {
//       type: String,
//       default: null,
//     },
//     // Para ordenar dentro de la página del álbum
//     order: {
//       type: Number,
//       default: 0,
//     },
//     active: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true },
// );

// export { RARITIES, GENRES };
// export default mongoose.model("Sticker", StickerSchema);
