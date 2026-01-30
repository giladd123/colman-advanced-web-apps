import { Request, Router } from "express";
import { createComment, getCommentsByPostID } from "../controllers/commentController";
import { createCommentValidator, getCommentsValidator } from "../middleware/commentValidator";

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

commentRouter.get("/:postID", getCommentsValidator, async (req: Request, res) => {
    const postID = req.params.postID as string;

    try {
    const comments = await getCommentsByPostID(postID);
    return res.status(200).json(comments);
    } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch comments" });
  }
});