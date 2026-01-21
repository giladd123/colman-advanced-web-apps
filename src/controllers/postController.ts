import { postModel } from "../models/post";

export async function addPost(title: string, sender: string, content: string) {
  const newPost = new postModel({ title, sender, content });
  return await newPost.save();
}
