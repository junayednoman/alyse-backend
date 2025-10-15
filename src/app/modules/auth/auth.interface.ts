import { ObjectId } from "mongoose";

export type TUserRole = "admin" | "principal" | "teacher";

export type TAuth = {
  email: string;
  password: string;
  user: ObjectId;
  role: TUserRole;
  fcmToken?: string;
  isAccountVerified: boolean;
  otp?: string;
  otpExpires?: Date;
  otpAttempts: number;
  isOtpVerified: boolean;
  needsPasswordChange: boolean;
  provider: "google" | "email" | "apple";
  isDeleted: boolean;
  isBlocked: boolean;
};
