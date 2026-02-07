import { InferSchemaType, Schema, model } from "mongoose";

const comment = new Schema(
  {
    postID: { type: Schema.Types.ObjectId, ref: "posts", required: true, index: true },
    userID: { type: Schema.Types.ObjectId, ref: "users", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const commentModel = model("comments", comment);
export type Comment = InferSchemaType<typeof comment>;
