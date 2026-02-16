import { postModel } from "../models/post";
import { commentModel } from "../models/comment";

export async function addPost(title: string, userID: string, content: string) {
  const newPost = new postModel({ title, userID, content });
  return await newPost.save();
}

export async function getAllPosts() {
  const posts = await postModel.find({});
  // For each post, recalculate commentsCount and update if needed
  await Promise.all(posts.map(async (post) => {
    const count = await commentModel.countDocuments({ postID: post._id });
    if (post.commentsCount !== count) {
      post.commentsCount = count;
      await post.save();
    }
  }));
  return await postModel.find({});
}

export async function getPostsByUser(userID: string) {
  return await postModel.find({ userID: userID });
}
export async function updatePost(
  postId: string,
  title?: string,
  content?: string,
) {
  const updateData: any = {};
  if (title) updateData.title = title;
  if (content) updateData.content = content;
  return await postModel.findByIdAndUpdate(postId, updateData, { new: true });
}

export async function deletePost(postId: string) {
  return await postModel.findByIdAndDelete(postId);
}
