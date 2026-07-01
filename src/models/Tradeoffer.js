// import mongoose from "mongoose";

// const TradeOfferSchema = new mongoose.Schema(
//   {
//     fromUser: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     toUser: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     // Lo que ofrece fromUser
//     offeredSticker: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Sticker",
//       required: true,
//     },
//     // Lo que pide fromUser a cambio
//     requestedSticker: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Sticker",
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ["pending", "accepted", "rejected", "cancelled"],
//       default: "pending",
//       index: true,
//     },
//     expiresAt: {
//       type: Date,
//       default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // 48hs
//     },
//   },
//   { timestamps: true },
// );

// export default mongoose.model("TradeOffer", TradeOfferSchema);
