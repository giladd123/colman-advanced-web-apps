import { Request, Router } from "express";
import {
  addPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  deletePost,
} from "../controllers/postController";
import { toggleLike } from "../controllers/likeController";
import {
  addPostValidator,
  putPostValidator,
  deletePostValidator,
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

postRouter.delete("/:postId", authenticate, deletePostValidator, async (req: Request, res) => {
  const postId = req.params.postId as string; // we know that postId is a string from the validator

  try {
    const deletedPost = await deletePost(postId);
    if (!deletedPost) {
      return res.status(404).json({ error: `Post ${postId} not found` });
    }
    return res.status(200).json({ message: `Post ${postId} deleted successfully`, post: deletedPost });
  } catch (error) {
    return res.status(500).json({ error: `Failed to delete post: ${postId}` });
  }
});

// Like/unlike a post (toggle)
postRouter.post("/:postId/like", authenticate, async (req: Request, res) => {
  const postId = req.params.postId as string;
  const userID = (req as any).user!.userID;
  try {
    const result = await toggleLike(postId, userID);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to toggle like" });
  }
});