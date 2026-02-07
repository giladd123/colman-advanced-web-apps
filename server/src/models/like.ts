import { InferSchemaType, Schema, model } from "mongoose";

const like = new Schema(
  {
    postID: {
      type: Schema.Types.ObjectId,
      ref: "posts",
      required: true,
    },
    userID: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

like.index({ postID: 1, userID: 1 }, { unique: true });

export const likeModel = model("likes", like);
export type Like = InferSchemaType<typeof like>;
