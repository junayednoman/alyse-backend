import { z } from "zod";

export const emailZod = z
  .string()
  .email("Invalid email address")
  .trim()
  .toLowerCase()
  .nonempty("Email is required");

export const passwordZod = z
  .string()
  .min(7, "Password must be at least 7 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );
