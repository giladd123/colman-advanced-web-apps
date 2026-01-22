import { Request, Response, NextFunction } from "express";
import { postModel } from "../models/post";
import mongoose from "mongoose";

export function addPostValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body is required" });
  }
  const { title, sender, content } = req.body;
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing title" });
  }
  if (!sender || typeof sender !== "string" || sender.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing sender" });
  }
  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing content" });
  }
  next();
}

export async function putPostValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body is required" });
  }
  if ("title" in req.body) {
    const { title } = req.body;
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "Invalid title" });
    }
  }
  if ("sender" in req.body) {
    const { sender } = req.body;
    if (typeof sender !== "string" || sender.trim() === "") {
      return res.status(400).json({ error: "Invalid sender" });
    }
  }
  if ("content" in req.body) {
    const { content } = req.body;
    if (typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "Invalid content" });
    }
  }
  if (!("postId" in req.params)) {
    return res.status(400).json({ error: "Post ID parameter is required" });
  }
  if (
    Array.isArray(req.params.postId) ||
    typeof req.params.postId !== "string" ||
    req.params.postId.trim() === ""
  ) {
    return res.status(400).json({ error: "Invalid postId" });
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
    return res.status(400).json({ error: "Invalid postId format" });
  }

  if ((await postModel.findById(req.params.postId)) === null) {
    return res.status(404).json({ error: "Post not found" });
  }
  next();
}
