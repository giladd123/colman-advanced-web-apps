import { Comment, commentModel } from "../models/comment";

export const createComment = async (comment: Comment) => commentModel.create(comment);