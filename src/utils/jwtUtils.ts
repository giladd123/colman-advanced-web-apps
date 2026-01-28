import jwt from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  username: string;
  email: string;
}

export function signAuthToken(payload: JwtPayload): string {
  const jwtSecret = process.env.JWT_SECRET!;
  return jwt.sign(payload, jwtSecret, { expiresIn: "15m" });
}

export function signRefreshToken(payload: JwtPayload): string {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
  return jwt.sign(payload, jwtRefreshSecret, { expiresIn: "7d" });
}

export function validateAuthToken(token: string): JwtPayload | null {
  const jwtSecret = process.env.JWT_SECRET!;
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function validateRefreshToken(token: string): JwtPayload | null {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
  try {
    const decoded = jwt.verify(token, jwtRefreshSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
