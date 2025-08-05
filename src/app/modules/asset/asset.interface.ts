import { ObjectId } from "mongoose";

export type TAsset = {
  name: string;
  description: string;
  material: string;
  quantity: number;
  images: string[];
  category: ObjectId;
  teacher: ObjectId;
  status: "available" | "grabbed";
  grabbedBy: ObjectId
  isApproved: boolean
  isDeleted: boolean
  district: ObjectId
};