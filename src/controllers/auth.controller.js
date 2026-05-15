import * as authService from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({ message: "User registered successfully", ...result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({ message: "Login successful", ...result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const result = await authService.googleLoginUser(req.body.idToken);
    res.status(200).json({ message: "Google login successful", ...result });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(400).json({ error: "Invalid Google token" });
  }
};
