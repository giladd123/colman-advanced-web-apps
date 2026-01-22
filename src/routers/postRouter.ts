import { Request, Router } from "express";
import { addPost, updatePost } from "../controllers/postController";
import {
  addPostValidator,
  putPostValidator,
} from "../middleware/postValidator";

export const postRouter = Router();

postRouter.post("/", addPostValidator, async (req: Request, res) => {
  const { title, sender, content } = req.body;
  try {
    await addPost(title, sender, content);
    return res.status(201).json({ message: "Post added successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to add post" });
  }
});

postRouter.put("/:postId", putPostValidator, async (req: Request, res) => {
  const postId = req.params.postId as string; // we know that postId is a string from the validator

  const { title, sender, content } = req.body;
  try {
    const updatedPost = await updatePost(postId, title, sender, content);
    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update post" });
  }
});
