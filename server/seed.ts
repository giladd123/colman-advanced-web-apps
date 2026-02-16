import mongoose from "mongoose";
import { User } from "./src/models/user";
import { postModel } from "./src/models/post";
import { commentModel } from "./src/models/comment";
import { likeModel } from "./src/models/like";
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";



async function seed() {
  const hashedPassword = await bcrypt.hash("qwe123", 10);
  await mongoose.connect(process.env.DATABASE_URL!);

  await User.deleteMany();
  await postModel.deleteMany();
  await commentModel.deleteMany();
  await likeModel.deleteMany();

  const users = await User.insertMany([
    {
      username: "alice",
      email: "alice@test.com",
      password: hashedPassword,
      profileImage: "https://i.pravatar.cc/150?img=1",
    },
    {
      username: "bob",
      email: "bob@test.com",
      password: hashedPassword,
      profileImage: "https://i.pravatar.cc/150?img=2",
    },
    {
      username: "charlie",
      email: "charlie@test.com",
      password: hashedPassword,
      profileImage: "https://i.pravatar.cc/150?img=3",
    },
  ]);

  const posts = await postModel.insertMany([
    {
      userID: users[0]._id,
      content: "This is my first post 👋",
      image: "https://picsum.photos/600/400?random=1",
      likesCount: 0,
      commentsCount: 0,
    },
    {
      userID: users[1]._id,
      content: "Loving this app already 🔥",
      image: "https://picsum.photos/600/400?random=2",
      likesCount: 0,
      commentsCount: 0,
    },
    {
      userID: users[2]._id,
      content: "Hello from Charlie!",
      image: "https://picsum.photos/600/400?random=3",
      likesCount: 0,
      commentsCount: 0,
    },
  ]);

  // create comments related to posts and users
  const comments = await commentModel.insertMany([
    {
      postID: posts[0]._id,
      userID: users[1]._id,
      content: "Nice post, Alice!",
    },
    {
      postID: posts[0]._id,
      userID: users[2]._id,
      content: "Welcome!",
    },
    {
      postID: posts[2]._id,
      userID: users[1]._id,
      content: "Hey Charlie, great to see you here.",
    },
  ]);

  // create likes linking users and posts
  const likes = await likeModel.insertMany([
    { postID: posts[0]._id, userID: users[1]._id },
    { postID: posts[0]._id, userID: users[2]._id },
    { postID: posts[1]._id, userID: users[0]._id },
  ]);

  // update posts counts based on inserted comments and likes
  for (const p of posts) {
    const commentsCount = await commentModel.countDocuments({ postID: p._id });
    const likesCount = await likeModel.countDocuments({ postID: p._id });
    await postModel.findByIdAndUpdate(p._id, { commentsCount, likesCount });
  }

  console.log("Seed data created");
  process.exit();
}

seed();
