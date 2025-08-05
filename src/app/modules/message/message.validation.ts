import { z } from "zod";

export const MessageValidationSchema = z.object({
  chat: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid chat ID format",
  }),
  text: z.string().min(1, "Text is required"),
  file: z.string().url("Invalid file URL").optional(),
});