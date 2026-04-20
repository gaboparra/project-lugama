import User from "../models/User.js";

export const getRanking = async (req, res) => {
  try {
    // Traemos los mejores 10, ordenados por puntos descendente (-1)
    const topUsers = await User.find()
      .select("username points")
      .sort({ points: -1 })
      .limit(10);

    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ error: "Error getting the ranking" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Error getting profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    if (!username)
      return res.status(400).json({ error: "Username is required" });

    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ error: "That username is already in use" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username },
      { returnDocument: "after" },
    ).select("-password");

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Error updating profile" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Required data is missing" });
    }

    const user = await User.findById(userId);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "The current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error changing password" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser)
      return res.status(404).json({ error: "User not found" });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting user" });
  }
};
