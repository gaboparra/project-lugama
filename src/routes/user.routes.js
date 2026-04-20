import { Router } from "express";
import {
  getRanking,
  getProfile,
  updateProfile,
  changePassword,
  deleteUser,
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/ranking", getRanking);
router.get("/me", protect, getProfile);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.delete("/delete-account", protect, deleteUser);

export default router;
