import mongoose from "mongoose";
import { postModel } from "../models/post";

export async function toggleLike(postID: string, userID: string) {
  const post = await postModel.findById(postID);
  if (!post) throw new Error("Post not found");

  const userObjectId = new mongoose.Types.ObjectId(userID);

  // convert existing likes to string for comparison only
  const likesAsStrings = post.likes.map((id: mongoose.Types.ObjectId) =>
    id.toString()
  );

  let liked: boolean;

  if (likesAsStrings.includes(userID)) {
    // Unlike
    post.likes = post.likes.filter(
      (id: mongoose.Types.ObjectId) => id.toString() !== userID
    );
    liked = false;
  } else {
    // Like
    post.likes.push(userObjectId);
    liked = true;
  }

  post.likesCount = post.likes.length;

  await post.save();

  return {
    liked,
    likesCount: post.likesCount,
    likes: post.likes,
  };
}

export async function hasUserLiked(postID: string, userID: string) {
  const post = await postModel.findById(postID);
  if (!post) return false;

  return post.likes.some(
    (id: mongoose.Types.ObjectId) => id.toString() === userID
  );
}

export async function getLikesCount(postID: string) {
  const post = await postModel.findById(postID);
  return post ? post.likes.length : 0;
}
