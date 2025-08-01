import { ObjectId } from "mongoose";

export type TPrincipal = {
  name: string;
  email: string;
  phone: string;
  image?: string;
  district: ObjectId
};