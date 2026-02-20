import { InferSchemaType, Schema, model } from "mongoose";

const postSchema = new Schema(
  {
    userID: { type: Schema.Types.ObjectId, ref: "users", required: true },
    content: { type: String, required: true },
    image: { type: String },
    likes: { type: [Schema.Types.ObjectId], ref: "users", default: [] },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const postModel = model("posts", postSchema);
export type Post = InferSchemaType<typeof postSchema>;
