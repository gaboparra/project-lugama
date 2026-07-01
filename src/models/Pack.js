// import mongoose from "mongoose";

// const PackSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     description: {
//       type: String,
//       default: null,
//     },
//     cost: {
//       type: Number,
//       required: true,
//       min: 1,
//     },
//     // Cuántas figuritas trae
//     stickerCount: {
//       type: Number,
//       required: true,
//       default: 5,
//     },
//     // Pesos de rareza (deben sumar 100)
//     rarityWeights: {
//       common: { type: Number, default: 64 },
//       rare: { type: Number, default: 30 },
//       epic: { type: Number, default: 5 },
//       legendary: { type: Number, default: 1 },
//     },
//     // Si está limitado a un género específico (null = todos los géneros)
//     genre: {
//       type: String,
//       default: null,
//     },
//     active: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true },
// );

// export default mongoose.model("Pack", PackSchema);
