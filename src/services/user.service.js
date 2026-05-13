import User from "../models/User.js";

export const getRankingList = async () => {
  return User.find().select("username points").sort({ points: -1 }).limit(10);
};

export const updateUsername = async (userId, username) => {
  if (!username)
    throw Object.assign(new Error("Username is required"), { status: 400 });

  const existing = await User.findOne({ username });
  if (existing && existing._id.toString() !== userId) {
    throw Object.assign(new Error("That username is already in use"), {
      status: 400,
    });
  }

  return User.findByIdAndUpdate(
    userId,
    { username },
    { returnDocument: "after" },
  ).select("-password");
};

export const updateUserPassword = async (
  userId,
  { currentPassword, newPassword },
) => {
  if (!currentPassword || !newPassword) {
    throw Object.assign(new Error("Required data is missing"), { status: 400 });
  }

  const user = await User.findById(userId);
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch)
    throw Object.assign(new Error("The current password is incorrect"), {
      status: 401,
    });

  user.password = newPassword;
  await user.save();
};

export const removeUser = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
};
