import { z } from "zod";

export const PrincipalValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  image: z.string().optional(),
  district: z.string({ required_error: "District ID is required" }).refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid district ID format",
  }),
});

export const UpdatePrincipalValidationSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 characters").optional(),
  image: z.string().optional(),
  district: z.string({ required_error: "District ID is required" }).refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid district ID format",
  }).optional(),
});