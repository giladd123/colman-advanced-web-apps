import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import fs from "fs";
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

export async function editUserPreUploadValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.params.id as string;

  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({ error: `Invalid user id: ${id}` });
  }

  if (!(await validateUserExists(req, res))) return;

  const authenticatedUserId = (req as any).user?.userID;
  if (authenticatedUserId !== id) {
    return res
      .status(403)
      .json({ error: "You can only update your own account" });
  }

  next();
}

export async function editUserBodyValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.params.id as string;
  const { email, username, password } = req.body;

  const reject = (status: number, error: string) => {
    removeUploadedFile(req);
    return res.status(status).json({ error });
  };

  if ("email" in req.body) {
    if (typeof email !== "string" || email.trim() === "") {
      return reject(400, "Invalid email");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reject(400, "Invalid email format");
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser && existingUser._id.toString() !== id) {
      return reject(409, "Email already exists");
    }
  }

  if ("username" in req.body) {
    if (typeof username !== "string" || username.trim() === "") {
      return reject(400, "Invalid username");
    }
  }

  if ("password" in req.body) {
    if (typeof password !== "string" || password.trim() === "") {
      return reject(400, "Invalid password");
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

function removeUploadedFile(req: Request) {
  if (req.file?.path) {
    fs.unlink(req.file.path, () => {});
  }
}
