// import Sticker from "../models/Sticker.js";
// import UserSticker from "../models/UserSticker.js";
// import Pack from "../models/Pack.js";
// import User from "../models/User.js";

// // ── Helper: weighted random de rareza ────────────────────────────────────────

// const rollRarity = (weights) => {
//   const total = Object.values(weights).reduce((a, b) => a + b, 0);
//   let roll = Math.random() * total;

//   for (const [rarity, weight] of Object.entries(weights)) {
//     roll -= weight;
//     if (roll <= 0) return rarity;
//   }

//   // Fallback por floating point edge case
//   return "common";
// };

// // ── Helper: agregar figurita al inventario (upsert) ──────────────────────────

// const addStickerToUser = async (userId, stickerId, source) => {
//   return UserSticker.findOneAndUpdate(
//     { userId, stickerId },
//     {
//       $inc: { quantity: 1 },
//       $setOnInsert: { firstObtainedAt: new Date(), source },
//     },
//     { upsert: true, returnDocument: "after" },
//   );
// };

// // ── Abrir sobre ───────────────────────────────────────────────────────────────

// export const openPack = async (userId, packId) => {
//   const [pack, user] = await Promise.all([
//     Pack.findById(packId),
//     User.findById(userId),
//   ]);

//   if (!pack || !pack.active)
//     throw Object.assign(new Error("Pack not found"), { status: 404 });

//   if (user.stars < pack.cost)
//     throw Object.assign(
//       new Error(
//         `Not enough stars. You need ${pack.cost}, you have ${user.stars}`,
//       ),
//       { status: 400 },
//     );

//   // Construir filtro base (puede estar limitado a un género)
//   const baseFilter = { active: true };
//   if (pack.genre) baseFilter.genre = pack.genre;

//   // Generar cada figurita del sobre
//   const results = [];

//   for (let i = 0; i < pack.stickerCount; i++) {
//     const rarity = rollRarity(pack.rarityWeights);

//     const filter = { ...baseFilter, rarity };
//     const count = await Sticker.countDocuments(filter);

//     if (count === 0) {
//       // Si no hay figuritas de ese tier, fallback a common
//       filter.rarity = "common";
//     }

//     const sticker = await Sticker.findOne(filter).skip(
//       Math.floor(Math.random() * Math.max(count, 1)),
//     );

//     if (!sticker) continue;

//     const userSticker = await addStickerToUser(userId, sticker._id, "pack");
//     const isDuplicate = userSticker.quantity > 1;

//     results.push({ sticker, isDuplicate });
//   }

//   // Descontar estrellas
//   const updatedUser = await User.findByIdAndUpdate(
//     userId,
//     { $inc: { stars: -pack.cost } },
//     { returnDocument: "after" },
//   ).select("stars");

//   return {
//     pack: { name: pack.name, cost: pack.cost },
//     stickers: results,
//     remainingStars: updatedUser.stars,
//   };
// };

// // ── Inventario del usuario ────────────────────────────────────────────────────

// export const getUserInventory = async (userId) => {
//   const inventory = await UserSticker.find({ userId })
//     .populate("stickerId")
//     .sort({ "stickerId.genre": 1, "stickerId.rarity": 1 });

//   return inventory.map((entry) => ({
//     sticker: entry.stickerId,
//     quantity: entry.quantity,
//     isDuplicate: entry.quantity > 1,
//     firstObtainedAt: entry.firstObtainedAt,
//     source: entry.source,
//   }));
// };

// // ── Álbum del usuario (todos los slots, pegados o vacíos) ─────────────────────

// export const getUserAlbum = async (userId) => {
//   const [allStickers, userStickers] = await Promise.all([
//     Sticker.find({ active: true }).sort({ genre: 1, order: 1 }),
//     UserSticker.find({ userId }).select("stickerId quantity"),
//   ]);

//   const owned = new Map(
//     userStickers.map((us) => [us.stickerId.toString(), us.quantity]),
//   );

//   // Agrupar por género
//   const album = {};
//   for (const sticker of allStickers) {
//     if (!album[sticker.genre]) album[sticker.genre] = [];
//     album[sticker.genre].push({
//       sticker,
//       owned: owned.has(sticker._id.toString()),
//       quantity: owned.get(sticker._id.toString()) ?? 0,
//     });
//   }

//   // Estadísticas de progreso
//   const totalSlots = allStickers.length;
//   const totalOwned = owned.size;

//   return {
//     album,
//     progress: {
//       owned: totalOwned,
//       total: totalSlots,
//       percentage:
//         totalSlots > 0 ? Math.round((totalOwned / totalSlots) * 100) : 0,
//     },
//   };
// };

// // ── Packs disponibles ─────────────────────────────────────────────────────────

// export const getAvailablePacks = async () => {
//   return Pack.find({ active: true }).sort({ cost: 1 });
// };

// // ── Admin: crear sticker ──────────────────────────────────────────────────────

// export const createSticker = async (data) => {
//   return Sticker.create(data);
// };

// // ── Admin: crear pack ─────────────────────────────────────────────────────────

// export const createPack = async (data) => {
//   return Pack.create(data);
// };
