import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import { getUserById, getUserByEmail } from "../controllers/userController";

export async function getUserByIdValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.params.id as string;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: `Invalid user id: ${id}` });
  }

  if (!(await validateUserExists(req, res))) return;

  next();
}

export async function editUserValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.params.id as string;

  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({ error: `Invalid user id: ${id}` });
  }

  if (!(await validateUserExists(req, res))) return;

  // Check if the authenticated user is the same as the user being edited
  const authenticatedUserId = (req as any).user?.userID;
  if (authenticatedUserId !== id) {
    return res
      .status(403)
      .json({ error: "You can only update your own account" });
  }

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body is required" });
  }

  const { email, username, password } = req.body;

  if ("email" in req.body) {
    if (typeof email !== "string" || email.trim() === "") {
      return res.status(400).json({ error: "Invalid email" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser && existingUser._id.toString() !== id) {
      return res.status(409).json({ error: "Email already exists" });
    }
  }

  if ("username" in req.body) {
    if (typeof username !== "string" || username.trim() === "") {
      return res.status(400).json({ error: "Invalid username" });
    }
  }

  if ("password" in req.body) {
    if (typeof password !== "string" || password.trim() === "") {
      return res.status(400).json({ error: "Invalid password" });
    }
  }

  next();
}

export const deleteUserValidator = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.params.id as string;

  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({ error: `Invalid user id: ${id}` });
  }

  if (!(await validateUserExists(req, res))) return;

  // Check if the authenticated user is the same as the user being deleted
  const authenticatedUserId = (req as any).user?.userID;
  if (authenticatedUserId !== id) {
    return res
      .status(403)
      .json({ error: "You can only delete your own account" });
  }

  next();
};

async function validateUserExists(
  req: Request,
  res: Response,
): Promise<boolean> {
  const id = req.params.id as string;
  const user = await getUserById(id);

  if (!user) {
    res.status(404).json({ error: `The user ${id} does not exist` });
    return false;
  }

  (req as any).targetUser = user;
  return true;
}
