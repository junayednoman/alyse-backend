import { ObjectId } from "mongoose";

export type TSchool = {
  name: string;
  district: ObjectId;
};