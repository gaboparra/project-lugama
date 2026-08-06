import { jest } from "@jest/globals";
import bcrypt from "bcrypt";
import prisma from "../src/config/prisma.js";
import { generateToken } from "../src/utils/generateToken.js";

jest.mock("../src/config/prisma.js", () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));
jest.mock("../src/utils/generateToken.js");
jest.mock("bcrypt");

jest.mock("google-auth-library", () => {
  const mockVerifyIdToken = jest.fn();
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
  };
});

import { OAuth2Client } from "google-auth-library";
import {
  registerUser,
  loginUser,
  getProfile,
  googleLoginUser,
} from "../src/services/auth.service.js";

const mockVerifyIdToken = new OAuth2Client().verifyIdToken;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("registerUser", () => {
  it("lanza error si el email o username ya existen", async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 1 });

    await expect(
      registerUser({
        username: "gabo",
        email: "gabo@test.com",
        password: "123456",
      }),
    ).rejects.toThrow("User or email already in use");
  });

  it("crea el usuario y devuelve token si no existe", async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hasheada");
    prisma.user.create.mockResolvedValue({
      id: 1,
      username: "gabo",
      points: 0,
      stars: 0,
    });
    generateToken.mockReturnValue("tokenFalso");

    const result = await registerUser({
      username: "gabo",
      email: "gabo@test.com",
      password: "123456",
    });

    expect(result.token).toBe("tokenFalso");
    expect(result.user.username).toBe("gabo");
  });
});

describe("loginUser", () => {
  it("lanza error si el usuario no existe", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      loginUser({ email: "noexiste@test.com", password: "123456" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("lanza error si el usuario no tiene password (registrado con Google)", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, password: null });

    await expect(
      loginUser({ email: "gabo@test.com", password: "cualquiera" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("lanza error si la contraseña no coincide", async () => {
    prisma.user.findUnique.mockResolvedValue({ password: "hasheada" });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      loginUser({ email: "gabo@test.com", password: "mala" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("devuelve token si las credenciales son correctas", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      username: "gabo",
      points: 10,
      stars: 2,
      password: "hasheada",
    });
    bcrypt.compare.mockResolvedValue(true);
    generateToken.mockReturnValue("tokenFalso");

    const result = await loginUser({
      email: "gabo@test.com",
      password: "buena",
    });

    expect(result.token).toBe("tokenFalso");
    expect(result.user.points).toBe(10);
  });
});

describe("getProfile", () => {
  it("lanza error si el usuario no existe", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(getProfile(999)).rejects.toThrow("User not found");
  });

  it("devuelve el usuario sin password", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, username: "gabo" });

    const result = await getProfile(1);

    expect(result).toEqual({ id: 1, username: "gabo" });
  });
});

describe("googleLoginUser", () => {
  it("crea un usuario nuevo si el email no existe todavía", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: "nuevo@gmail.com",
        name: "Gabo",
        sub: "googleId123",
      }),
    });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 1,
      username: "Gabo",
      points: 0,
      stars: 0,
    });
    generateToken.mockReturnValue("tokenFalso");

    const result = await googleLoginUser("idTokenFalso");

    expect(prisma.user.create).toHaveBeenCalled();
    expect(result.token).toBe("tokenFalso");
  });

  it("usa el usuario existente si el email ya está registrado", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: "existente@gmail.com",
        name: "Gabo",
        sub: "googleId123",
      }),
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      username: "Gabo",
      points: 5,
      stars: 1,
    });
    generateToken.mockReturnValue("tokenFalso");

    const result = await googleLoginUser("idTokenFalso");

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(result.user.points).toBe(5);
  });
});
