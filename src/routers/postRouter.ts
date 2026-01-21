import { Request, Router } from "express";
import { addPost } from "../controllers/postController";
import { addPostValidator } from "../middleware/postValidator";

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
