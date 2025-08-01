import { ObjectId } from "mongoose";

export type TPrincipal = {
  _id?: string; // Optional, as Mongoose generates it
  name: string;
  email: string;
  phone: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
};