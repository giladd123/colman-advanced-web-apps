import { InferSchemaType, Schema, model } from 'mongoose';

const comment = new Schema({
    postID: { type: Schema.Types.ObjectId, ref: 'posts', required: true },
    sender: { type: String, required: true },
    content: { type: String, required: true},
});

export const commentModel = model('comments', comment);
export type Comment = InferSchemaType<typeof comment>;