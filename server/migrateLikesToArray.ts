import mongoose from "mongoose";
import { postModel } from "./src/models/post";
import { likeModel } from "./src/models/like";
import dotenv from "dotenv";
dotenv.config();

async function migrateLikes() {
  await mongoose.connect(process.env.DATABASE_URL!);
  const posts = await postModel.find({});
  for (const post of posts) {
    // If likes array is missing or empty, backfill from likeModel
    if (!post.likes || post.likes.length === 0) {
      const likes = await likeModel.find({ postID: post._id });
      post.likes = likes.map((like: any) => like.userID);
      post.likesCount = post.likes.length;
      await post.save();
      console.log(`Updated post ${post._id} with ${post.likes.length} likes.`);
    }
  }
  console.log("Migration complete.");
  process.exit();
}

migrateLikes();