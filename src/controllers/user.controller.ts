import { Response } from "express";
import * as userService from "../services/user.service.js";
import { AuthRequest } from "../types/express.js";
import { getErrorInfo } from "../utils/errors.js";

export const getRanking = async (req: AuthRequest, res: Response) => {
  try {
    const users = await userService.getRankingList();
    res.json(users);
  } catch {
    res.status(500).json({ error: "Error getting the ranking" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.updateUsername(
      req.user!.id,
      req.body.username,
    );
    res.json({ message: "Profile updated", user });
  } catch (error) {
    const { status, message } = getErrorInfo(error);
    res.status(status).json({ error: message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    await userService.updateUserPassword(req.user!.id, req.body);
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    const { status, message } = getErrorInfo(error);
    res.status(status).json({ error: message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    await userService.removeUser(req.user!.id);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    const { status, message } = getErrorInfo(error);
    res.status(status).json({ error: message });
  }
};
