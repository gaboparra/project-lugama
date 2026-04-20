import { Router } from "express";
import {
  addSong,
  getAllSongs,
  updateSong,
  deleteSong,
  getRandomSong,
  validateAnswer,
  searchExternalSong,
  searchSongsInDb,
  seedDatabase,
} from "../controllers/song.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/add", protect, isAdmin, addSong);
router.get("/all", getAllSongs);
router.get("/random", protect, getRandomSong);
router.post("/validate", protect, validateAnswer);
router.get("/search-external", protect, isAdmin, searchExternalSong);
router.get("/search", searchSongsInDb);
router.post("/seed", protect, isAdmin, seedDatabase);

router.put("/update/:id", protect, isAdmin, updateSong);
router.delete("/delete/:id", protect, isAdmin, deleteSong);

export default router;
