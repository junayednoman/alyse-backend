import { z } from "zod";
import { emailZod, passwordZod } from "../../validation/global.validation";

export const loginUserValidationSchema = z.object({
  email: emailZod,
  password: z.string().nonempty("Password is required"),
  fcmToken: z.string().optional(),
  isMobileApp: z.boolean().optional().default(false),
});

export type TLoginUser = z.infer<typeof loginUserValidationSchema>;

export const socialLoginZod = z.object({
  email: emailZod,
  name: z.string().optional(),
  image: z.string().optional(),
  fcmToken: z.string().optional(),
  provider: z.enum(["google", "apple"]),
  district: z.string().optional(),
  school: z.string().optional(),
});

export type ISocialLogin = z.infer<typeof socialLoginZod>;

export const emailValidationSchema = z.object({
  email: emailZod,
});

export const verifyOtpSchema = z.object({
  email: emailZod,
  otp: z.string().nonempty("OTP is required"),
  verifyAccount: z.boolean().optional(),
});

export const resetForgottenPasswordSchema = z.object({
  email: emailZod,
  password: passwordZod,
});

export const changePasswordValidationSchema = z.object({
  oldPassword: z.string().nonempty("Old Password is required"),
  newPassword: passwordZod,
});
