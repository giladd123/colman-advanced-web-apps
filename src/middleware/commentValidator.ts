import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import { postModel } from "../models/post";
import { User } from "../models/user";
import { getCommentById } from "../controllers/commentController";

export async function createCommentValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body is required" });
  }

  const { postID, content } = req.body;
  const userID = (req as any).user!.userID;

  if (!userID || typeof userID !== "string" || userID.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing userID" });
  }

  if (!isValidObjectId(userID)) {
    return res.status(400).json({ error: "Invalid userID format" });
  }

  const userExists = await User.findById(userID);
  if (!userExists) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing content" });
  }

  if (!postID || typeof postID !== "string") {
    return res.status(400).json({ error: "Invalid or missing postID" });
  }

  if (!isValidObjectId(postID)) {
    return res.status(400).json({ error: `Invalid postID: ${postID}` });
  }

  next();
}

export async function getCommentsValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const postID = req.params.postID;
  const postExists = await postModel.findById(postID);

  if (!postExists) {
    return res.status(404).json({ error: `Post ${postID} not found` });
  }

  if (!postID || typeof postID !== "string") {
    return res.status(400).json({ error: "postID query param is required" });
  }

  if (!isValidObjectId(postID)) {
    return res.status(400).json({ error: `Invalid postID: ${postID}` });
  }

  next();
}

export async function getCommentByIdValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.params.id as string;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Comment ID is required" });
  }

  if (!(await validateCommentExists(req, res))) return;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: `Invalid comment id: ${id}` });
  }

  next();
}

export async function editCommentValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.params.id as string;

  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({ error: `Invalid comment id: ${id}` });
  }

  if (!(await validateCommentExists(req, res))) return;
  const comment = (req as any).comment;
  const userID = (req as any).user!.userID

  if (comment.userID.toString() !== userID) {
    return res.status(403).json({ error: "The user is not allowed to modify this comment" });
  }

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body is required" });
  }

  const { content } = req.body;

  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing content" });
  }

  next();
}

export const deleteCommentValidation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.params.id as string;

  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({ error: `Invalid comment id: ${id}` });
  }

  if (!(await validateCommentExists(req, res))) return;
  const comment = (req as any).comment;
  const userID = (req as any).user!.userID

  if (comment.userID.toString() !== userID) {
    return res.status(403).json({ error: "The user is not allowed to modify this comment" });
  }
  next();
};

async function validateCommentExists(
  req: Request,
  res: Response,
): Promise<boolean> {
  const id = req.params.id as string;
  const comment = await getCommentById(id);

  if (!comment) {
    res.status(404).json({ error: `The comment ${id} in not exists` });
    return false;
  }

  (req as any).comment = comment;
  return true;
}
