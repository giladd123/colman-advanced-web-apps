import { Comment, commentModel } from "../models/comment";
import { postModel } from "../models/post";

export const createComment = async (comment: Comment) => commentModel.create(comment);

export const getCommentsByPostID = async (postID: string) => await commentModel.find({ postID });

export const getCommentById = async (_id: string) => await commentModel.findOne({ _id });

export const editComment = async (comment: Partial<Omit<Comment, 'postID'>>, id: string) =>
    await commentModel.findByIdAndUpdate(id, comment, { new: true });

export const deleteComment = async (commentId: string) => await commentModel.deleteOne({ _id: commentId });

// Recalculate and update the commentsCount for a post
export async function updateCommentsCount(postID: string) {
  const count = await commentModel.countDocuments({ postID });
  await postModel.findByIdAndUpdate(postID, { commentsCount: count });
}