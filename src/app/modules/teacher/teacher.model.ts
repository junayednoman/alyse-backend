import mongoose, { Schema, Types } from "mongoose";
import { TTeacher } from "./teacher.interface";

const TeacherSchema = new Schema<TTeacher>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    roomNumber: { type: String, default: null },
    school: { type: Types.ObjectId, ref: "School", required: true },
    district: { type: Types.ObjectId, ref: "District", required: true },
    image: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

export const Teacher = mongoose.model<TTeacher>("Teacher", TeacherSchema);

export default Teacher;
