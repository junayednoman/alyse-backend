import { z } from "zod";

export const AssetValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  material: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  category: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid category ID format",
  }),
});

export const deleteAssetImageValidationSchema = z.object({ imageUrl: z.string().url("Invalid image URL") })