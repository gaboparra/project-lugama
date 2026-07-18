import jwt from "jsonwebtoken";
import { Types } from "mongoose";

interface UserForToken {
  _id: Types.ObjectId | string;
  username: string;
  role: string;
}

export const generateToken = (user: UserForToken): string => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "30d",
    },
  );
};
