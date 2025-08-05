import mongoose, { Schema, Types } from "mongoose";
import { TChat } from "./chat.interface";

const ChatSchema = new Schema<TChat>(
  {
    asset: { type: Types.ObjectId, ref: "Asset", required: true },
    participants: { type: [Types.ObjectId], ref: "Auth", required: true },
    lastMessage: { type: Types.ObjectId, ref: "Message", default: null },
  },
  {
    timestamps: true,
  }
);

export const Chat = mongoose.model<TChat>("Chat", ChatSchema);

export default Chat;