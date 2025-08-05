import { z } from "zod";

export const ChatValidationSchema = z.object({
  asset: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid asset ID format",
  })
});