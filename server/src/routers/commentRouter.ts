import { Request, Router } from "express";
import {
  createComment,
  getCommentsByPostID,
  editComment,
  deleteComment,
} from "../controllers/commentController";
import { updateCommentsCount } from "../controllers/commentController";
import {
  createCommentValidator,
  getCommentsValidator,
  getCommentByIdValidator,
  editCommentValidator,
  deleteCommentValidation,
} from "../middleware/commentValidator";
import { Types } from "mongoose";
import { authenticate } from "../middleware/authValidator";

export const commentRouter = Router();

commentRouter.post("/",
  authenticate,          
  createCommentValidator,
  async (req: Request, res) => {
  const { postID, content } = req.body;
  const userID = new Types.ObjectId((req as any).user!.userID);

  try {
    const comment = await createComment({ postID, userID, content, createdAt: new Date(), updatedAt: new Date() });
    await updateCommentsCount(postID);
    return res.status(201).json(comment);
  } catch (error) {
    return res.status(500).json({ error: "Failed to creaate a comment" });
  }
});

commentRouter.get(
  "/postID/:postID",
  getCommentsValidator,
  async (req: Request, res) => {
    const postID = req.params.postID as string;

    try {
      const comments = await getCommentsByPostID(postID);
      return res.status(200).json(comments);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: `Failed to fetch comments of the post ${postID}` });
    }
  },
);

commentRouter.get(
  "/commentID/:id",
  getCommentByIdValidator,
  async (req: Request, res) => {
    const id = req.params.id as string;

    try {
      const comment = (req as any).comment;
      return res.status(200).json(comment);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: `Failed to fetch comment ${id}` });
    }
  },
);

commentRouter.put("/:id", authenticate, editCommentValidator, async (req: Request, res) => {
  const id = req.params.id as string;
  const { content } = req.body;

  try {
    const updatedComment = await editComment({ content }, id);
    return res.status(200).json(updatedComment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update comment" });
  }
});

commentRouter.delete(
  "/:id",
  authenticate,
  deleteCommentValidation,
  async (req: Request, res) => {
    const id = req.params.id as string;

    try {
      // Find the comment to get its postID
      const comment = await (await import("../models/comment")).commentModel.findById(id);
      const postID = comment?.postID;
      await deleteComment(id);
      if (postID) {
        await updateCommentsCount(postID.toString());
      }
      return res
        .status(200)
        .json({ message: `The comment ${id} deleted successfully` });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: `Failed to delete comment ${id}` });
    }
  },
);
