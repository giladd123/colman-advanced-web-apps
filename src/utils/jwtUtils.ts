import jwt from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  username: string;
  email: string;
}

export function signAuthToken(payload: JwtPayload): string {
  const jwtSecret = process.env.JWT_SECRET!;
  return jwt.sign(payload, jwtSecret);
}
