import { z } from "zod";

export const deleteFileValidationSchema = z.object({
  file_url: z.string().min(1, "URL is required"),
});