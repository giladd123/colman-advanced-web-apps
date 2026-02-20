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

/**
 * @openapi
 * /api/comments:
 *   post:
 *     tags:
 *       - Comments
 *     summary: Create a new comment on a post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postID
 *               - content
 *             properties:
 *               postID:
 *                 type: string
 *                 description: The ID of the post to comment on
 *                 example: 64a1f2c3b4d5e6f7a8b9c0d1
 *               content:
 *                 type: string
 *                 example: Great post!
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create comment
 */
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

/**
 * @openapi
 * /api/comments/postID/{postID}:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Get comments for a specific post with pagination
 *     parameters:
 *       - in: path
 *         name: postID
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Number of comments per page
 *     responses:
 *       200:
 *         description: Paginated list of comments for the post (descending order)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 *       400:
 *         description: Validation error
 *       500:
 *         description: Failed to fetch comments
 */
commentRouter.get(
  "/postID/:postID",
  getCommentsValidator,
  async (req: Request, res) => {
    const postID = req.params.postID as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    try {
      const result = await getCommentsByPostID(postID, page, limit);
      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: `Failed to fetch comments of the post ${postID}` });
    }
  },
);

/**
 * @openapi
 * /api/comments/commentID/{id}:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Get a specific comment by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment
 *     responses:
 *       200:
 *         description: The requested comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Failed to fetch comment
 */
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

/**
 * @openapi
 * /api/comments/{id}:
 *   put:
 *     tags:
 *       - Comments
 *     summary: Edit a comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to edit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Updated comment text
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Failed to update comment
 */
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

/**
 * @openapi
 * /api/comments/{id}:
 *   delete:
 *     tags:
 *       - Comments
 *     summary: Delete a comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Failed to delete comment
 */
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
