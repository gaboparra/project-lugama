import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

export const registerUser = async ({ username, email, password }) => {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing)
    throw Object.assign(new Error("User or email already in use"), {
      status: 400,
    });

  const user = await User.create({ username, email, password });
  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      points: user.points,
      stars: user.stars,
    },
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user)
    throw Object.assign(new Error("Invalid credentials"), { status: 400 });

  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    throw Object.assign(new Error("Invalid credentials"), { status: 400 });

  const token = generateToken(user);
  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      points: user.points,
      stars: user.stars,
    },
  };
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  return user;
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLoginUser = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { email, name, sub: googleId } = ticket.getPayload();
  let user = await User.findOne({ email });
  if (!user) user = await User.create({ username: name, email, googleId });

  const token = generateToken(user);
  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      points: user.points,
      stars: user.stars,
    },
  };
};
