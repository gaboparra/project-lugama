import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import prisma from "../config/prisma.js";
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
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) throw createError("User or email already in use", 400);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword },
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
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
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) throw createError("Invalid credentials", 400);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw createError("Invalid credentials", 400);

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      points: user.points,
      stars: user.stars,
    },
  };
};

export const getProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      points: true,
      stars: true,
      role: true,
      createdAt: true,
    },
  });
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
  if (!email || !name) throw createError("Invalid Google token", 400);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { username: name, email, googleId },
    });
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      points: user.points,
      stars: user.stars,
    },
  };
};
