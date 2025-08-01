import { z } from "zod";

export const SchoolValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  district: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid district ID format",
  }),
});