import mongoose, { Schema, Types } from "mongoose";
import { TPrincipal } from "./principal.interface";

const PrincipalSchema = new Schema<TPrincipal>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    image: { type: String },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

export const Principal = mongoose.model<TPrincipal>("Principal", PrincipalSchema);

export default Principal;