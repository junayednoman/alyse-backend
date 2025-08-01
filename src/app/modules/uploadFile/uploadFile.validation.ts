import { z } from "zod";

export const deleteFileValidationSchema = z.object({
  fileUrl: z.string().min(1, "URL is required"),
});