import { postModel } from "../models/post";
import { commentModel } from "../models/comment";
import { embeddingModel } from "../models/embedding";
import { getEmbedding } from "../services/llmService";

export async function addPost(userID: string, content: string, image?: string) {
  const newPost = new postModel({ userID, content, ...(image && { image }) });
  const saved = await newPost.save();

  // add embedding (non-blocking)
  getEmbedding(content)
    .then((embedding) =>
      embeddingModel.create({ sourceType: "post", sourceId: saved._id, content, embedding })
    )
    .catch((err) => console.error("Failed to index post:", err));

  return saved;
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
  return await postModel.find({}).sort({ createdAt: -1 });
}

export async function getPostsByUser(userID: string) {
  return await postModel.find({ userID: userID }).sort({ createdAt: -1 });
}
export async function updatePost(
  postId: string,
  content?: string,
  image?: string,
) {
  const updateData: any = {};
  if (content) updateData.content = content;
  if (image) updateData.image = image;
  return await postModel.findByIdAndUpdate(postId, updateData, { new: true });
}

export async function deletePost(postId: string) {
  return await postModel.findByIdAndDelete(postId);
}
