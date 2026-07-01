// import { Router } from "express";
// import {
//   openPack,
//   getMyInventory,
//   getMyAlbum,
//   getPacks,
//   createSticker,
//   createPack,
// } from "../controllers/sticker.controller.js";
// import { protect } from "../middlewares/auth.middleware.js";
// import { isAdmin } from "../middlewares/role.middleware.js";

// const router = Router();

// router.get("/packs", protect, getPacks);
// router.post("/packs/:packId/open", protect, openPack);
// router.get("/inventory", protect, getMyInventory);
// router.get("/album", protect, getMyAlbum);

// // Admin
// router.post("/", protect, isAdmin, createSticker);
// router.post("/packs", protect, isAdmin, createPack);

// export default router;
