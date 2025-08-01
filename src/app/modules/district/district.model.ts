import { model, Schema } from "mongoose";
import { TDistrict } from "./district.interface";

export const DistrictMongooseSchema = new Schema<TDistrict>(
  {
    name: { type: String, required: true },
    logo: { type: String, required: true },
    code: { type: String, required: true },
    type: { type: String, enum: ['strict', 'non-strict'], required: true },
  },
  { timestamps: true }
);

export const District = model<TDistrict>('District', DistrictMongooseSchema);