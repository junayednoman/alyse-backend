import { ObjectId } from "mongoose";

export type TNotificationPayload = {
  receiver: ObjectId;
  title: string;
  body: string;
  image?: string;
  link?: string;
  hasRead?: boolean;
};
