import { postModel } from "../models/post";
import { commentModel } from "../models/comment";
import { embeddingModel } from "../models/embedding";
import { getEmbedding, getEmbeddingWithContext, askLLM } from "../services/llmService";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function indexContent() {
  const posts = await postModel.find({});
  const comments = await commentModel.find({});

  let indexed = 0;

  for (const post of posts) {
    const exists = await embeddingModel.findOne({
      sourceType: "post",
      sourceId: post._id,
    });
    if (exists) continue;

    const embedding = await getEmbeddingWithContext(post.content);
    await embeddingModel.create({
      sourceType: "post",
      sourceId: post._id,
      content: post.content,
      embedding,
    });
    indexed++;
  }

  for (const comment of comments) {
    const exists = await embeddingModel.findOne({
      sourceType: "comment",
      sourceId: comment._id,
    });
    if (exists) continue;

    const post = posts.find((p) => p._id.equals(comment.postID));
    const embedding = await getEmbeddingWithContext(comment.content, post?.content);
    await embeddingModel.create({
      sourceType: "comment",
      sourceId: comment._id,
      content: comment.content,
      embedding,
    });
    indexed++;
  }

  return { indexed, total: posts.length + comments.length };
}

const TOP_K = 5;
const SCORE_THRESHOLD = 0.5;

export async function queryRAG(question: string) {
  const questionEmbedding = await getEmbedding(question);

  const allEmbeddings = await embeddingModel.find({});

  const scored = allEmbeddings
    .map((doc) => ({
      content: doc.content,
      sourceType: doc.sourceType,
      sourceId: doc.sourceId.toString(),
      score: cosineSimilarity(questionEmbedding, doc.embedding),
    }))
    .filter((item) => item.score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  const sourcesWithPost = await Promise.all(
    scored.map(async (item) => {
      let postId: string;
      if (item.sourceType === "post") {
        postId = item.sourceId;
      } else {
        const comment = await commentModel.findById(item.sourceId);
        postId = comment ? comment.postID.toString() : "";
      }
      return { ...item, postId };
    }),
  );

  const context = scored
    .map((item) => `[${item.sourceType}] ${item.content}`)
    .join("\n\n");

  const prompt = context
    ? `You are a helpful assistant for the Codely code forum. Answer the user's question based on the following forum content:\n\n${context}\n\nQuestion: ${question}\n\nAnswer based on the forum content above. If the content doesn't help answer the question, say so.`
    : `You are a helpful assistant for the Codely code forum. The user asked: "${question}"\n\nNo relevant forum content was found. Let the user know and don't attempt to answer based on non-forum knowledge.`;

  const answer = await askLLM(prompt);

  return { answer, sources: sourcesWithPost };
}
