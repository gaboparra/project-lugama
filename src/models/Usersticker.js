// import mongoose from "mongoose";

// const UserStickerSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     stickerId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Sticker",
//       required: true,
//     },
//     quantity: {
//       type: Number,
//       default: 1,
//       min: 0,
//     },
//     // Para saber cuándo la obtuvo por primera vez
//     firstObtainedAt: {
//       type: Date,
//       default: Date.now,
//     },
//     // Para saber cómo llegó la última copia
//     source: {
//       type: String,
//       enum: ["pack", "trade"],
//       required: true,
//     },
//   },
//   { timestamps: true },
// );

// // Un usuario no puede tener la misma figurita duplicada en dos documentos
// UserStickerSchema.index({ userId: 1, stickerId: 1 }, { unique: true });

// export default mongoose.model("UserSticker", UserStickerSchema);
