import { Request, Router } from "express";
import { createComment } from "../controllers/commentController";
import { createCommentValidator } from "../middleware/commentValidator";

export const commentRouter = Router();

commentRouter.post("/", createCommentValidator, async (req: Request, res) => {
    const { postID, sender, content } = req.body;

    try {
      const comment = await createComment({ sender, content, postID });
      return res.status(201).json(comment);
    } catch (error) {
      return res.status(500).json({ error: "Failed to creaate a comment" });
    }
  }
);