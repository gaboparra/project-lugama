import { jest } from "@jest/globals";
import { errorHandler } from "../src/middlewares/error.middleware.js";

describe("errorHandler", () => {
  it("responde 500 con mensaje genérico", () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const error = new Error("Algo explotó");

    // Silenciamos el console.error para no ensuciar la salida del test
    jest.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
