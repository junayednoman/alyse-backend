import { ObjectId } from "mongoose"

export type TChat = {
  _id?: string;
  asset: ObjectId;
  participants: ObjectId[];
  lastMessage?: ObjectId;
};