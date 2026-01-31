import { postModel } from "../models/post";

export async function addPost(title: string, userID: string, content: string) {
  const newPost = new postModel({ title, userID, content });
  return await newPost.save();
}

export async function getAllPosts() {
  return await postModel.find({});
}
export async function getPostsByUser(userID: string) {
  return await postModel.find({ userID: userID });
}
export async function updatePost(
  postId: string,
  title?: string,
  userID?: string,
  content?: string,
) {
  const updateData: any = {};
  if (title) updateData.title = title;
  if (userID) updateData.userID = userID;
  if (content) updateData.content = content;
  return await postModel.findByIdAndUpdate(postId, updateData, { new: true });
}
