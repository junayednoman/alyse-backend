import mongoose, { Schema, Types } from "mongoose";
import { TAsset } from "./asset.interface";
import { assetStatus } from "../../constants/global.constant";

const AssetSchema = new Schema<TAsset>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    material: { type: String },
    quantity: { type: Number, required: true },
    images: { type: [String], required: true },
    category: { type: Types.ObjectId, ref: "Category", required: true },
    teacher: { type: Types.ObjectId, ref: "Auth", required: true },
    status: { type: String, enum: [assetStatus.available, assetStatus.grabbed], required: true, default: "available" },
    grabbedBy: { type: Types.ObjectId, ref: "Auth" },
    isDeleted: { type: Boolean, default: false },
    district: { type: Types.ObjectId, ref: "District", required: true },
  },
  {
    timestamps: true,
  }
);

export const Asset = mongoose.model<TAsset>("Asset", AssetSchema);

export default Asset;