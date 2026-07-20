import User from "../models/User.js";
import { createError } from "../utils/errors.js";

interface AppError extends Error {
  status?: number;
}

export const getRankingList = async () => {
  return User.find().select("username points").sort({ points: -1 }).limit(10);
};

export const updateUsername = async (userId: string, username: string) => {
  if (!username) throw createError("Username is required", 400);

  const existing = await User.findOne({ username });
  if (existing && existing._id.toString() !== userId) {
    throw createError("That username is already in use", 400);
  }

  return User.findByIdAndUpdate(
    userId,
    { username },
    { returnDocument: "after" },
  ).select("-password");
};

interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const updateUserPassword = async (
  userId: string,
  { currentPassword, newPassword }: UpdatePasswordInput,
) => {
  if (!currentPassword || !newPassword) {
    throw createError("Required data is missing", 400);
  }

  const user = await User.findById(userId);
  if (!user) throw createError("User not found", 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw createError("The current password is incorrect", 401);

  user.password = newPassword;
  await user.save();
};

export const removeUser = async (userId: string) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw createError("User not found", 404);
};
