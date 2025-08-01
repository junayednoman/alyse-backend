import { ObjectId } from "mongoose";

export type TTeacher = {
  name: string;
  email: string;
  roomNumber: string;
  school: ObjectId;
  district: ObjectId;
  image?: string;
};