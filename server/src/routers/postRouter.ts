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
import { upload } from "../middleware/upload";

export const postRouter = Router();

/**
 * @openapi
 * /api/posts:
 *   post:
 *     tags:
 *       - Posts
 *     summary: Create a new post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Hello world!
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to add post
 */
postRouter.post(
  "/",
  authenticate,
  upload.single("image"),
  addPostValidator,
  async (req: Request, res) => {
    const { content } = req.body;
    const userID = (req as any).user!.userID;
    const image = (req as any).file ? `/uploads/${(req as any).file.filename}` : undefined;
    try {
      const newPost = await addPost(userID, content, image);
      return res.status(201).json(newPost);
    } catch (error) {
      return res.status(500).json({ error: "Failed to add post" });
    }
  },
);

/**
 * @openapi
 * /api/posts:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get all posts, optionally filtered by user
 *     parameters:
 *       - in: query
 *         name: userID
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter posts by user ID
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Failed to retrieve posts
 */
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

/**
 * @openapi
 * /api/posts/{postId}:
 *   put:
 *     tags:
 *       - Posts
 *     summary: Update a post's content and/or image
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: Updated post content
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to update post
 */
postRouter.put(
  "/:postId",
  authenticate,
  upload.single("image"),
  putPostValidator,
  async (req: Request, res) => {
    const postId = req.params.postId as string; // we know that postId is a string from the validator
    const { content } = req.body;
    const image = (req as any).file ? `/uploads/${(req as any).file.filename}` : undefined;

    try {
      const updatedPost = await updatePost(postId, content, image);
      if (!updatedPost) {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(200).json(updatedPost);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update post" });
    }
  },
);

/**
 * @openapi
 * /api/posts/{postId}:
 *   delete:
 *     tags:
 *       - Posts
 *     summary: Delete a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to delete post
 */
postRouter.delete(
  "/:postId",
  authenticate,
  deletePostValidator,
  async (req: Request, res) => {
    const postId = req.params.postId as string; // we know that postId is a string from the validator

    try {
      const deletedPost = await deletePost(postId);
      if (!deletedPost) {
        return res.status(404).json({ error: `Post ${postId} not found` });
      }
      return res
        .status(200)
        .json({
          message: `Post ${postId} deleted successfully`,
          post: deletedPost,
        });
    } catch (error) {
      return res
        .status(500)
        .json({ error: `Failed to delete post: ${postId}` });
    }
  },
);

/**
 * @openapi
 * /api/posts/{postId}/like:
 *   post:
 *     tags:
 *       - Posts
 *     summary: Toggle like on a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to like/unlike
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 *                 likesCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to toggle like
 */
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
