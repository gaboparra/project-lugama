import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { protect } from "../src/middlewares/auth.middleware.js";

jest.mock("jsonwebtoken");

describe("protect middleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("token válido: decodifica y llama a next()", async () => {
    req.headers.authorization = "Bearer token123";
    jwt.verify.mockReturnValue({ id: "user1", role: "user" });

    await protect(req, res, next);

    expect(req.user).toEqual({ id: "user1", role: "user" });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("token inválido: responde 401 token failed", async () => {
    req.headers.authorization = "Bearer tokenMalo";
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Not authorized, token failed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("sin header authorization: responde 401 token missing", async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Not authorized, token missing",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
