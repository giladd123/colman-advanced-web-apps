import { InferSchemaType, Schema, model } from "mongoose";

const postSchema = new Schema({
  title: { type: String, required: true },
  userID: { type: String, required: true },
  content: { type: String, required: true },
});

export const postModel = model("posts", postSchema);
export type Post = InferSchemaType<typeof postSchema>;
