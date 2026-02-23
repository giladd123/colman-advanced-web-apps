import { Request, Response, NextFunction } from "express";
import { validateAuthToken } from "../utils/jwtUtils";

export async function validateLogin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { email, password } = req.body;
  if (!email || typeof email !== "string" || email.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing email" });
  }
  if (!password || typeof password !== "string" || password.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing password" });
  }
  next();
}

export async function validateRegister(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { username, email, password } = req.body;

  if (!username || typeof username !== "string" || username.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing username" });
  }
  if (
    !email ||
    typeof email !== "string" ||
    email.trim() === "" ||
    email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/) === null
  ) {
    return res.status(400).json({ error: "Invalid or missing email" });
  }
  if (!password || typeof password !== "string" || password.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing password" });
  }
  next();
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];

  const decoded = validateAuthToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" });
  }

  (req as any).user = decoded; // Attach decoded token to request object
  next();
}

export async function validateRefreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { refreshToken } = req.body;
  if (
    !refreshToken ||
    typeof refreshToken !== "string" ||
    refreshToken.trim() === ""
  ) {
    return res.status(400).json({ error: "Refresh token is required" });
  }
  next();
}

export async function validateGoogleCredential(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { credential } = req.body;
  if (!credential || typeof credential !== "string" || credential.trim() === "") {
    return res.status(400).json({ error: "Google credential is required" });
  }
  next();
}
