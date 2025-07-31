import { z } from 'zod'

export const updateSettingsSchema = z.object({
  terms_conditions: z
    .string()
    .nonempty('Terms and conditions are required')
    .optional(),
  about_us: z.string().nonempty('About us section is required').optional(),
  privacy_policy: z.string().nonempty('Privacy policy is required').optional(),
})
