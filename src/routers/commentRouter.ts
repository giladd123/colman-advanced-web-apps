import { Request, Router } from "express";
import { createComment, getCommentsByPostID, getCommentById } from "../controllers/commentController";
import { createCommentValidator, getCommentsValidator, getCommentByIdValidator } from "../middleware/commentValidator";

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

commentRouter.get("/postID/:postID", getCommentsValidator, async (req: Request, res) => {
    const postID = req.params.postID as string;

    try {
      const comments = await getCommentsByPostID(postID);
      return res.status(200).json(comments);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch comments" });
  }
});

commentRouter.get("/commentID/:id", getCommentByIdValidator, async (req: Request, res) => {
  const id = req.params.id as string;
 
  try {
    const comment = await getCommentById(id);

    if (!comment) {
      return res.status(404).json({ error: `Comment with id ${id} not found` });
    }

    return res.status(200).json(comment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch comment" });
  }
});