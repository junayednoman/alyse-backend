import { z } from "zod";

export const DistrictValidationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  type: z.enum(['strict', 'non-strict'], {
    errorMap: () => ({ message: 'Type must be either "strict" or "non-strict"' }),
  }),
});

export const updateDistrictValidationSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  code: z.string().min(1, 'Code is required').optional(),
  type: z.enum(['strict', 'non-strict'], {
    errorMap: () => ({ message: 'Type must be either "strict" or "non-strict"' }),
  }).optional(),
})