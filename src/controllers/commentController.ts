import { Comment, commentModel } from "../models/comment";

export const createComment = async (comment: Comment) => commentModel.create(comment);

export const getCommentsByPostID = async (postID: string) => await commentModel.find({ postID });

