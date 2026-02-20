import { Comment, commentModel } from "../models/comment";
import { postModel } from "../models/post";
import { embeddingModel } from "../models/embedding";
import { getEmbeddingWithContext } from "../services/llmService";

export const createComment = async (comment: Comment) => {
  const created = await commentModel.create(comment);

  // Add embedding (non-blocking)
  postModel.findById(comment.postID).then((post) =>
    getEmbeddingWithContext(comment.content, post?.content)
      .then((embedding) =>
        embeddingModel.create({ sourceType: "comment", sourceId: created._id, content: comment.content, embedding })
      )
      .catch((err) => console.error("Failed to index comment:", err))
  );

  return created;
};

export const getCommentsByPostID = async (postID: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const total = await commentModel.countDocuments({ postID });
  const data = await commentModel.find({ postID }).sort({ createdAt: -1 }).skip(skip).limit(limit);
  return { data, page, limit, total, hasMore: skip + data.length < total };
};

export const getCommentById = async (_id: string) => await commentModel.findOne({ _id });

export const editComment = async (comment: Partial<Omit<Comment, 'postID'>>, id: string) =>
    await commentModel.findByIdAndUpdate(id, comment, { new: true });

export const deleteComment = async (commentId: string) => await commentModel.deleteOne({ _id: commentId });

// Recalculate and update the commentsCount for a post
export async function updateCommentsCount(postID: string) {
  const count = await commentModel.countDocuments({ postID });
  await postModel.findByIdAndUpdate(postID, { commentsCount: count });
}