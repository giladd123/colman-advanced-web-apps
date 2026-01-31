import { Request, Response, NextFunction } from "express";
import { postModel } from "../models/post";
import { User } from "../models/user";
import mongoose from "mongoose";

export async function addPostValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body is required" });
  }
  const { title, content } = req.body;
  const userID = (req as any).user!.userID

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing title" });
  }
  if (!userID || typeof userID !== "string" || userID.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing userID" });
  }
  if (!mongoose.Types.ObjectId.isValid(userID)) {
    return res.status(400).json({ error: "Invalid userID format" });
  }
  const userExists = await User.findById(userID);
  if (!userExists) {
    return res.status(404).json({ error: "User not found" });
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
    const userID = (req as any).user!.userID
    if (typeof userID !== "string" || userID.trim() === "") {
      return res.status(400).json({ error: "Invalid userID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return res.status(400).json({ error: "Invalid userID format" });
    }

    const userExists = await User.findById(userID);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
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
  const post = await postModel.findById(req.params.postId)
  if (post === null) {
    return res.status(404).json({ error: "Post not found" });
  }

  if (post.userID.toString() !== userID) {
    return res.status(403).json({ error: "The user is not allowed to modify this post" });
  }
  next();
}
