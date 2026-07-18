import { Response } from "express";
import * as authService from "../services/auth.service.js";
import { AuthRequest } from "../types/express.js";
import { getErrorInfo } from "../utils/errors.js";
import { Request } from "express";

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({ message: "User registered successfully", ...result });
  } catch (error) {
    const { status, message } = getErrorInfo(error);
    res.status(status).json({ error: message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({ message: "Login successful", ...result });
  } catch (error) {
    const { status, message } = getErrorInfo(error);
    res.status(status).json({ error: message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getProfile(req.user!.id);
    res.status(200).json(user);
  } catch (error) {
    const { status, message } = getErrorInfo(error);
    res.status(status).json({ error: message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const result = await authService.googleLoginUser(req.body.idToken);
    res.status(200).json({ message: "Google login successful", ...result });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(400).json({ error: "Invalid Google token" });
  }
};
