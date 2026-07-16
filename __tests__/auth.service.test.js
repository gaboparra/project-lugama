import { jest } from "@jest/globals";
import User from "../src/models/User.js";
import { generateToken } from "../src/utils/generateToken.js";

jest.mock("../src/models/User.js");
jest.mock("../src/utils/generateToken.js");

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
    User.findOne.mockResolvedValue({ _id: "existente" });

    await expect(
      registerUser({
        username: "gabo",
        email: "gabo@test.com",
        password: "123456",
      }),
    ).rejects.toThrow("User or email already in use");
  });

  it("crea el usuario y devuelve token si no existe", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: "1",
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
    User.findOne.mockResolvedValue(null);

    await expect(
      loginUser({ email: "noexiste@test.com", password: "123456" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("lanza error si la contraseña no coincide", async () => {
    User.findOne.mockResolvedValue({
      comparePassword: jest.fn().mockResolvedValue(false),
    });

    await expect(
      loginUser({ email: "gabo@test.com", password: "mala" }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("devuelve token si las credenciales son correctas", async () => {
    User.findOne.mockResolvedValue({
      _id: "1",
      username: "gabo",
      points: 10,
      stars: 2,
      comparePassword: jest.fn().mockResolvedValue(true),
    });
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
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await expect(getProfile("userInexistente")).rejects.toThrow(
      "User not found",
    );
  });

  it("devuelve el usuario sin password", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ username: "gabo" }),
    });

    const result = await getProfile("user1");

    expect(result).toEqual({ username: "gabo" });
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
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: "1",
      username: "Gabo",
      points: 0,
      stars: 0,
    });
    generateToken.mockReturnValue("tokenFalso");

    const result = await googleLoginUser("idTokenFalso");

    expect(User.create).toHaveBeenCalled();
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
    User.findOne.mockResolvedValue({
      _id: "1",
      username: "Gabo",
      points: 5,
      stars: 1,
    });
    generateToken.mockReturnValue("tokenFalso");

    const result = await googleLoginUser("idTokenFalso");

    expect(User.create).not.toHaveBeenCalled();
    expect(result.user.points).toBe(5);
  });
});
