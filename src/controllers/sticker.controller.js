// import * as stickerService from "../services/sticker.service.js";

// export const openPack = async (req, res) => {
//   try {
//     const result = await stickerService.openPack(
//       req.user.id,
//       req.params.packId,
//     );
//     res.json(result);
//   } catch (error) {
//     res.status(error.status || 500).json({ error: error.message });
//   }
// };

// export const getMyInventory = async (req, res) => {
//   try {
//     const inventory = await stickerService.getUserInventory(req.user.id);
//     res.json(inventory);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching inventory" });
//   }
// };

// export const getMyAlbum = async (req, res) => {
//   try {
//     const album = await stickerService.getUserAlbum(req.user.id);
//     res.json(album);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching album" });
//   }
// };

// export const getPacks = async (req, res) => {
//   try {
//     const packs = await stickerService.getAvailablePacks();
//     res.json(packs);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching packs" });
//   }
// };

// // Admin
// export const createSticker = async (req, res) => {
//   try {
//     const sticker = await stickerService.createSticker(req.body);
//     res.status(201).json(sticker);
//   } catch (error) {
//     res.status(error.status || 500).json({ error: error.message });
//   }
// };

// export const createPack = async (req, res) => {
//   try {
//     const pack = await stickerService.createPack(req.body);
//     res.status(201).json(pack);
//   } catch (error) {
//     res.status(error.status || 500).json({ error: error.message });
//   }
// };
