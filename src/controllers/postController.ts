import { postModel } from "../models/post";

export async function addPost(title: string, sender: string, content: string) {
  const newPost = new postModel({ title, sender, content });
  return await newPost.save();
}

export async function updatePost(
  postId: string,
  title?: string,
  sender?: string,
  content?: string,
) {
  const updateData: any = {};
  if (title) updateData.title = title;
  if (sender) updateData.sender = sender;
  if (content) updateData.content = content;
  return await postModel.findByIdAndUpdate(postId, updateData, { new: true });
}
