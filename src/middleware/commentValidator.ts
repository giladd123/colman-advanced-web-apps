import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import { postModel } from "../models/post";
import { log } from "node:console";

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
