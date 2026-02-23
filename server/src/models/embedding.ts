import { InferSchemaType, Schema, model } from "mongoose";

const embeddingSchema = new Schema(
  {
    sourceType: {
      type: String,
      required: true,
      enum: ["post", "comment"],
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
);

embeddingSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });

export const embeddingModel = model("embeddings", embeddingSchema);
export type Embedding = InferSchemaType<typeof embeddingSchema>;
