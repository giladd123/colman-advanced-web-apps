import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import { postModel } from "../models/post";
import { log } from "node:console";
import { getCommentById } from "../controllers/commentController";

export async function createCommentValidator(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body is required" });
  }

  const { postID, sender, content } = req.body;

  if (!sender || typeof sender !== "string" || sender.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing sender" });
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

  const postExists = await postModel.findById(postID);
  if (!postExists) {
    return res.status(404).json({ error: "Post not found" });
  }

  next();
}

export function getCommentsValidator(req: Request, res: Response, next: NextFunction) {
  const postID = req.params.postID;

  if (!postID || typeof postID !== "string") {
    return res.status(400).json({ error: "postID query param is required" });
  }

  if (!isValidObjectId(postID)) {
    return res.status(400).json({ error: "Invalid postID" });
  }

  next();
}

export async function getCommentByIdValidator(req: Request, res: Response, next: NextFunction) {
  const id= req.params.id as string;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Comment ID is required" });
  }

  if (!(await validateCommentExists(req, res))) return;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid comment ID" });
  }

  next();
}

export async function editCommentValidator(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const id = req.params.id as string;

  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid comment id" });
  }

  if (!(await validateCommentExists(req, res))) return;

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body is required" });
  }

  const { content } = req.body;

  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing content" });
  }

  next();
}

async function validateCommentExists(req: Request, res: Response): Promise<boolean> {
  const id = req.params.id as string;
  const comment = await getCommentById(id);

  if (!comment) {
    res.status(404).json({ error: `The comment ${id} in not exists` });
    return false;
  }

  (req as any).comment = comment;
  return true;
}
