import { postModel } from "../models/post";
import { commentModel } from "../models/comment";
import { embeddingModel } from "../models/embedding";
import { getEmbeddingWithContext, askLLM } from "../services/llmService";

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
    const embedding = await getEmbeddingWithContext(
      comment.content,
      post?.content,
    );
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

const TOP_K_THREADS = 3;
const SCORE_THRESHOLD = 0.5;

export async function queryRAG(question: string) {
  const questionEmbedding = await getEmbeddingWithContext(question);

  const allEmbeddings = await embeddingModel.find({});

  const scored = allEmbeddings
    .map((doc) => ({
      content: doc.content,
      sourceType: doc.sourceType,
      sourceId: doc.sourceId.toString(),
      score: cosineSimilarity(questionEmbedding, doc.embedding),
    }))
    .filter((item) => item.score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  // Resolve postId for all scored items
  const scoredWithPostId = await Promise.all(
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

  // Group by thread (postId)
  const threadMap = new Map<string, typeof scoredWithPostId>();
  for (const item of scoredWithPostId) {
    if (!item.postId) continue;
    const existing = threadMap.get(item.postId) || [];
    existing.push(item);
    threadMap.set(item.postId, existing);
  }

  // Rank threads by best individual score, take top threads
  const rankedThreads = [...threadMap.entries()]
    .map(([postId, items]) => ({
      postId,
      bestScore: Math.max(...items.map((i) => i.score)),
      bestItem: items.reduce((a, b) => (a.score > b.score ? a : b)),
    }))
    .sort((a, b) => b.bestScore - a.bestScore)
    .slice(0, TOP_K_THREADS);

  // Fetch full thread content and build structured context
  const contextBlocks: string[] = [];
  const sources: {
    content: string;
    sourceType: string;
    sourceId: string;
    score: number;
    postId: string;
  }[] = [];

  for (const thread of rankedThreads) {
    const post = await postModel.findById(thread.postId);
    const comments = await commentModel
      .find({ postID: thread.postId })
      .sort({ createdAt: 1 });

    let block = `=== Thread ===\n`;
    block += `[Post]: ${post?.content || "(post not found)"}\n`;
    for (const comment of comments) {
      block += `[Reply]: ${comment.content}\n`;
    }
    contextBlocks.push(block);

    sources.push({
      content: thread.bestItem.content,
      sourceType: thread.bestItem.sourceType,
      sourceId: thread.bestItem.sourceId,
      score: thread.bestScore,
      postId: thread.postId,
    });
  }

  const context = contextBlocks.join("\n\n");

  const prompt = context
    ? `You are a helpful assistant for the Codely code forum.

Below are relevant forum threads. Each thread starts with the original post (a question or discussion), followed by replies that may contain solutions, corrections, or additional context.

${context}
Question: ${question}

Instructions:
- Answer based only on the forum threads above.
- Pay special attention to replies, as they often contain solutions and corrections to the original post's question.
- If multiple threads are relevant, synthesize the information.
- If the content doesn't help answer the question, say so.`
    : `You are a helpful assistant for the Codely code forum. The user asked: "${question}"\n\nNo relevant forum content was found. Let the user know and don't attempt to answer based on non-forum knowledge.`;

  const answer = await askLLM(prompt);

  return { answer, sources };
}
