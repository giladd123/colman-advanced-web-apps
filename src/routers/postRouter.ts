import { Request, Router } from "express";
import {
  addPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
} from "../controllers/postController";
import {
  addPostValidator,
  putPostValidator,
} from "../middleware/postValidator";
import { authenticate } from "../middleware/authValidator";

export const postRouter = Router();

postRouter.post("/", authenticate, addPostValidator, async (req: Request, res) => {
  const { title, content } = req.body;
  const userID = (req as any).user!.userID
  try {
    const newPost = await addPost(title, userID, content);
    return res.status(201).json(newPost);
  } catch (error) {
    return res.status(500).json({ error: "Failed to add post" });
  }
});

postRouter.get("/", async (req: Request, res) => {
  try {
    let posts;
    if (!req.query.userID) {
      posts = await getAllPosts();
    } else {
      const userID = req.query.userID as string;
      posts = await getPostsByUser(userID);
    }
    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve posts" });
  }
});

postRouter.put("/:postId",authenticate, putPostValidator, async (req: Request, res) => {
  const postId = req.params.postId as string; // we know that postId is a string from the validator
  const { title, content } = req.body;

  try {
    const updatedPost = await updatePost(postId, title, content);
    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(200).json(updatedPost);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update post" });
  }
});
