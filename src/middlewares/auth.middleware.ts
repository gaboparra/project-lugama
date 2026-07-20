import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/express.js";

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

      req.user = decoded as AuthRequest["user"];

      next();
    } catch (error) {
      res.status(401).json({ error: "Not authorized, token failed" });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ error: "Not authorized, token missing" });
  }
};
