import * as userService from "../services/user.service.js";

export const getRanking = async (req, res) => {
  try {
    const users = await userService.getRankingList();
    res.json(users);
  } catch {
    res.status(500).json({ error: "Error getting the ranking" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await userService.updateUsername(
      req.user.id,
      req.body.username,
    );
    res.json({ message: "Profile updated", user });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    await userService.updateUserPassword(req.user.id, req.body);
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await userService.removeUser(req.user.id);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
