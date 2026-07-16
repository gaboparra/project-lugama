import { jest } from "@jest/globals";
import { isAdmin } from "../src/middlewares/role.middleware.js";

describe("isAdmin", () => {
  it("permite continuar si el usuario es admin", () => {
    const req = { user: { role: "admin" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    isAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("deniega si el usuario no es admin", () => {
    const req = { user: { role: "user" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Access denied: administrator permissions required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("deniega si no hay req.user", () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
