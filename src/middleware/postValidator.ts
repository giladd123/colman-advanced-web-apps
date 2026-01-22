import { Request, Response, NextFunction } from "express";

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
