import { jest } from "@jest/globals";
import User from "../src/models/User.js";
import {
  getRankingList,
  updateUsername,
  updateUserPassword,
  removeUser,
} from "../src/services/user.service.js";

jest.mock("../src/models/User.js");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getRankingList", () => {
  it("devuelve el top 10 ordenado por puntos", async () => {
    const mockUsers = [{ username: "gabo", points: 100 }];
    User.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockUsers),
        }),
      }),
    });

    const result = await getRankingList();

    expect(result).toEqual(mockUsers);
  });
});

describe("updateUsername", () => {
  it("lanza error si no se envía username", async () => {
    await expect(updateUsername("user1", "")).rejects.toThrow(
      "Username is required",
    );
  });

  it("lanza error si el username ya está en uso por otro usuario", async () => {
    User.findOne.mockResolvedValue({ _id: "otroUser" });

    await expect(updateUsername("user1", "nombreTomado")).rejects.toThrow(
      "That username is already in use",
    );
  });

  it("permite actualizar si el username pertenece al mismo usuario", async () => {
    User.findOne.mockResolvedValue({ _id: { toString: () => "user1" } });
    User.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue({ username: "nuevoNombre" }),
    });

    const result = await updateUsername("user1", "nuevoNombre");

    expect(result).toEqual({ username: "nuevoNombre" });
  });

  it("actualiza el username si está libre", async () => {
    User.findOne.mockResolvedValue(null);
    User.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue({ username: "nuevoNombre" }),
    });

    const result = await updateUsername("user1", "nuevoNombre");

    expect(result).toEqual({ username: "nuevoNombre" });
  });
});

describe("updateUserPassword", () => {
  it("lanza error si falta currentPassword o newPassword", async () => {
    await expect(
      updateUserPassword("user1", { currentPassword: "", newPassword: "" }),
    ).rejects.toThrow("Required data is missing");
  });

  it("lanza error si la contraseña actual es incorrecta", async () => {
    User.findById.mockResolvedValue({
      comparePassword: jest.fn().mockResolvedValue(false),
    });

    await expect(
      updateUserPassword("user1", {
        currentPassword: "mala",
        newPassword: "nueva123",
      }),
    ).rejects.toThrow("The current password is incorrect");
  });

  it("actualiza la contraseña si la actual es correcta", async () => {
    const mockUser = {
      comparePassword: jest.fn().mockResolvedValue(true),
      password: "vieja",
      save: jest.fn().mockResolvedValue(true),
    };
    User.findById.mockResolvedValue(mockUser);

    await updateUserPassword("user1", {
      currentPassword: "vieja",
      newPassword: "nueva123",
    });

    expect(mockUser.password).toBe("nueva123");
    expect(mockUser.save).toHaveBeenCalled();
  });
});

describe("removeUser", () => {
  it("lanza error si el usuario no existe", async () => {
    User.findByIdAndDelete.mockResolvedValue(null);

    await expect(removeUser("userInexistente")).rejects.toThrow(
      "User not found",
    );
  });

  it("elimina el usuario si existe", async () => {
    User.findByIdAndDelete.mockResolvedValue({ _id: "user1" });

    await expect(removeUser("user1")).resolves.toBeUndefined();
  });
});
