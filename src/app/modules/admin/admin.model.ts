import mongoose, { Schema } from "mongoose";
import { TAdmin } from "./admin.interface";

const adminSchema = new Schema<TAdmin>(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, default: null },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true, default: null },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.model<TAdmin>("Admin", adminSchema);
export default Admin;
