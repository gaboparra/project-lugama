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

const router = Router();

router.post("/add", addSong);
router.get("/all", getAllSongs);
router.put("/update/:id", updateSong);
router.delete("/delete/:id", deleteSong);
router.get("/random", getRandomSong);
router.post("/validate", validateAnswer);
router.get("/search-external", searchExternalSong);
router.get("/search", searchSongsInDb);
router.post("/seed", seedDatabase);

export default router;
