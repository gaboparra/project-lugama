import jwt from "jsonwebtoken";

interface UserForToken {
  id: number;
  username: string;
  role: string;
}

export const generateToken = (user: UserForToken): string => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "30d",
    },
  );
};
