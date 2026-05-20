import { Router } from "express";
import {
  createChallenge,
  joinChallenge,
  getChallenge,
  validateChallengeAnswer,
  getChallengeResults,
} from "../controllers/challenge.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", protect, createChallenge);
router.post("/:code/join", protect, joinChallenge);
router.get("/:code", protect, getChallenge);
router.post("/:code/validate", protect, validateChallengeAnswer);
router.get("/:code/results", protect, getChallengeResults);

export default router;
