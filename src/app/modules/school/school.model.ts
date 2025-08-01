import mongoose, { Schema, Types } from "mongoose";
import { TSchool } from "./school.interface";

const SchoolSchema = new Schema<TSchool>(
  {
    name: { type: String, required: true },
    district: { type: Types.ObjectId, ref: "District", required: true },
  },
  {
    timestamps: true,
  }
);

export const School = mongoose.model<TSchool>("School", SchoolSchema);

export default School;