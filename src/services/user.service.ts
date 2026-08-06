import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import { createError } from "../utils/errors.js";

export const getRankingList = async () => {
  return prisma.user.findMany({
    select: { username: true, points: true },
    orderBy: { points: "desc" },
    take: 10,
  });
};

export const updateUsername = async (userId: number, username: string) => {
  if (!username) throw createError("Username is required", 400);

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== userId) {
    throw createError("That username is already in use", 400);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { username },
    select: {
      id: true,
      username: true,
      email: true,
      points: true,
      stars: true,
      role: true,
    },
  });
};

interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const updateUserPassword = async (
  userId: number,
  { currentPassword, newPassword }: UpdatePasswordInput,
) => {
  if (!currentPassword || !newPassword) {
    throw createError("Required data is missing", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError("User not found", 404);
  if (!user.password)
    throw createError("This account doesn't use password login", 400);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw createError("The current password is incorrect", 401);

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });
};

export const removeUser = async (userId: number) => {
  const user = await prisma.user
    .delete({ where: { id: userId } })
    .catch(() => null);
  if (!user) throw createError("User not found", 404);
};
