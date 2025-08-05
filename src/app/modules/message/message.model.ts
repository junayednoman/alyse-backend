import mongoose, { Schema, Types } from "mongoose";
import { TMessage } from "./message.interface";

const MessageSchema = new Schema<TMessage>(
  {
    chat: { type: Types.ObjectId, ref: "Chat", required: true },
    text: { type: String, required: true },
    file: { type: String, default: null },
    isSeen: { type: Boolean, default: false },
    sender: { type: Types.ObjectId, ref: "Auth", required: true },
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model<TMessage>("Message", MessageSchema);

export default Message;