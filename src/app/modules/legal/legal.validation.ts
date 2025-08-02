import { z } from 'zod'

export const updateLegalSchema = z.object({
  termsConditions: z
    .string()
    .nonempty('Terms and conditions are required')
    .optional(),
  aboutUs: z.string().nonempty('About us section is required').optional(),
  privacyPolicy: z.string().nonempty('Privacy policy is required').optional(),
})
