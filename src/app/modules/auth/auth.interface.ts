import { ObjectId } from "mongoose";

export type TUserRole = "admin" | "principal" | "teacher";

export type TAuth = {
  email: string;
  password: string;
  user: ObjectId
  role: TUserRole;
  isAccountVerified: boolean;
  otp?: string;
  otpExpires?: Date;
  otpAttempts: number;
  isOtpVerified: boolean;
  needsPasswordChange: boolean;
  isDeleted: boolean;
  isBlocked: boolean;
};
