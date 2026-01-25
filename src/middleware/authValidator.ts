import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export async function validateLogin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
      if (err) {
        return res.status(401).json({ error: "Invalid token" });
      }
    });
    (req as any).user = decoded; // Attach decoded token to request object
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
