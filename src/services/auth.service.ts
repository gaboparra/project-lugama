import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { createError } from "../utils/errors.js";

interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
}

export const registerUser = async ({
  username,
  email,
  password,
}: RegisterUserInput) => {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) throw createError("User or email already in use", 400);

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

interface LoginUserInput {
  email: string;
  password: string;
}

export const loginUser = async ({ email, password }: LoginUserInput) => {
  const user = await User.findOne({ email });
  if (!user) throw createError("Invalid credentials", 400);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw createError("Invalid credentials", 400);

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

export const getProfile = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw createError("User not found", 404);
  return user;
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLoginUser = async (idToken: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw createError("Invalid Google token", 400);

  const { email, name, sub: googleId } = payload;
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
