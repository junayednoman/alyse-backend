import { ObjectId } from "mongoose";

export type TMessage = {
  chat: ObjectId;
  text: string;
  file?: string;
  isSeen?: boolean;
  sender: ObjectId;
};