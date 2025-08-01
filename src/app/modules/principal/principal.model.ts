import mongoose, { Schema } from "mongoose";
import { TPrincipal } from "./principal.interface";

const PrincipalSchema = new Schema<TPrincipal>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  image: { type: String },
  district: { type: Schema.Types.ObjectId, ref: "District", required: true },
},
  {
    timestamps: true,
  }
);

export const Principal = mongoose.model<TPrincipal>("Principal", PrincipalSchema);

export default Principal;