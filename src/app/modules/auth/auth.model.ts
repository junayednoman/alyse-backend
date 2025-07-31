import mongoose, { Schema } from "mongoose";
import { TAuth } from "./auth.interface";

const userSchema = new Schema<TAuth>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    user_type: {
      type: String,
      enum: ["Employee", "CompanyAdmin", "Admin"],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "user_type",
      required: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["employee", "company_admin", "admin"],
      required: true,
    },
    is_account_verified: { type: Boolean, default: undefined },
    otp: { type: String, trim: true },
    otp_expires: { type: Date },
    otp_attempts: { type: Number, default: undefined },
    is_otp_verified: { type: Boolean, default: undefined },
    is_deleted: { type: Boolean, default: false },
    is_blocked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Auth = mongoose.model<TAuth>("Auth", userSchema);
export default Auth;