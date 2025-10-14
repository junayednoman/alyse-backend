import mongoose, { Schema } from "mongoose";
import { TAuth } from "./auth.interface";
import { userRoles } from "../../constants/global.constant";

const userSchema = new Schema<TAuth>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "role",
      required: true,
    },
    password: { type: String, default: undefined },
    role: {
      type: String,
      enum: [userRoles.admin, userRoles.principal, userRoles.teacher],
      required: true,
    },
    isAccountVerified: { type: Boolean, default: undefined },
    otp: { type: String, trim: true },
    otpExpires: { type: Date },
    otpAttempts: { type: Number, default: undefined },
    isOtpVerified: { type: Boolean, default: undefined },
    needsPasswordChange: { type: Boolean, default: undefined },
    provider: {
      type: String,
      enum: ["google", "apple", "email"],
      default: "email",
    },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Auth = mongoose.model<TAuth>("Auth", userSchema);
export default Auth;
