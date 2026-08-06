import { jest } from "@jest/globals";
import bcrypt from "bcrypt";
import prisma from "../src/config/prisma.js";
import {
  getRankingList,
  updateUsername,
  updateUserPassword,
  removeUser,
} from "../src/services/user.service.js";

jest.mock("../src/config/prisma.js", () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("bcrypt");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getRankingList", () => {
  it("devuelve el top 10 ordenado por puntos", async () => {
    const mockUsers = [{ username: "gabo", points: 100 }];
    prisma.user.findMany.mockResolvedValue(mockUsers);

    const result = await getRankingList();

    expect(result).toEqual(mockUsers);
  });
});

describe("updateUsername", () => {
  it("lanza error si no se envía username", async () => {
    await expect(updateUsername(1, "")).rejects.toThrow("Username is required");
  });

  it("lanza error si el username ya está en uso por otro usuario", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2 });

    await expect(updateUsername(1, "nombreTomado")).rejects.toThrow(
      "That username is already in use",
    );
  });

  it("permite actualizar si el username pertenece al mismo usuario", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1 });
    prisma.user.update.mockResolvedValue({ username: "nuevoNombre" });

    const result = await updateUsername(1, "nuevoNombre");

    expect(result).toEqual({ username: "nuevoNombre" });
  });

  it("actualiza el username si está libre", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.update.mockResolvedValue({ username: "nuevoNombre" });

    const result = await updateUsername(1, "nuevoNombre");

    expect(result).toEqual({ username: "nuevoNombre" });
  });
});

describe("updateUserPassword", () => {
  it("lanza error si falta currentPassword o newPassword", async () => {
    await expect(
      updateUserPassword(1, { currentPassword: "", newPassword: "" }),
    ).rejects.toThrow("Required data is missing");
  });

  it("lanza error si el usuario no existe", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      updateUserPassword(1, {
        currentPassword: "vieja",
        newPassword: "nueva123",
      }),
    ).rejects.toThrow("User not found");
  });

  it("lanza error si la contraseña actual es incorrecta", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, password: "hasheada" });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      updateUserPassword(1, {
        currentPassword: "mala",
        newPassword: "nueva123",
      }),
    ).rejects.toThrow("The current password is incorrect");
  });

  it("actualiza la contraseña si la actual es correcta", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, password: "hasheada" });
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue("nuevaHasheada");

    await updateUserPassword(1, {
      currentPassword: "vieja",
      newPassword: "nueva123",
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { password: "nuevaHasheada" },
    });
  });
});

describe("removeUser", () => {
  it("lanza error si el usuario no existe", async () => {
    prisma.user.delete.mockRejectedValue(new Error("Not found"));

    await expect(removeUser(999)).rejects.toThrow("User not found");
  });

  it("elimina el usuario si existe", async () => {
    prisma.user.delete.mockResolvedValue({ id: 1 });

    await expect(removeUser(1)).resolves.toBeUndefined();
  });
});
