import { Request, Router } from "express";
import { createComment, getCommentsByPostID, editComment, deleteComment } from "../controllers/commentController";
import { createCommentValidator, getCommentsValidator, getCommentByIdValidator, editCommentValidator, deleteCommentValidation } from "../middleware/commentValidator";

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
      return res.status(500).json({ error: `Failed to fetch comments of the post ${postID}` });
  }
});

commentRouter.get("/commentID/:id", getCommentByIdValidator, async (req: Request, res) => {
  const id = req.params.id as string;
 
  try {
    const comment = (req as any).comment;
    return res.status(200).json(comment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: `Failed to fetch comment ${id}`});
  }
});

commentRouter.put("/:id", editCommentValidator, async (req: Request, res) => {
    const id = req.params.id as string;
    const { sender, content } = req.body;
    
    try {
      const updatedComment = await editComment({ sender, content }, id);
      return res.status(200).json(updatedComment);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update comment" });
    }
  }
);

commentRouter.delete("/:id", deleteCommentValidation, async (req: Request, res) => {
    const id = req.params.id as string;

    try {
      await deleteComment(id);
      return res.status(200).json({ message: `The comment ${id} deleted successfully` });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: `Failed to delete comment ${id}` });
    }
  }
);