import { Request, Router } from "express";
import { indexContent, queryRAG } from "../controllers/ragController";
import { authenticate } from "../middleware/authValidator";

export const ragRouter = Router();

/**
 * @openapi
 * /api/rag/index:
 *   post:
 *     tags:
 *       - RAG
 *     summary: Index all posts and comments for RAG
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Indexing completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 indexed:
 *                   type: integer
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Indexing failed
 */
ragRouter.post("/index", authenticate, async (_req: Request, res) => {
  try {
    const result = await indexContent();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Indexing failed:", error);
    return res.status(500).json({ error: "Indexing failed" });
  }
});

/**
 * @openapi
 * /api/rag/query:
 *   post:
 *     tags:
 *       - RAG
 *     summary: Ask a question answered using forum content
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 example: What are the most discussed topics?
 *     responses:
 *       200:
 *         description: Answer from the LLM
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       content:
 *                         type: string
 *                       sourceType:
 *                         type: string
 *                       score:
 *                         type: number
 *       400:
 *         description: Missing question
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Query failed
 */
ragRouter.post("/query", authenticate, async (req: Request, res) => {
  const { question } = req.body;
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    const result = await queryRAG(question);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Query failed:", error);
    return res.status(500).json({ error: "Query failed" });
  }
});
