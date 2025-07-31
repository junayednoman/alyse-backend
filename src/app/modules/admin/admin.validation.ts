import { z } from "zod";

const updateAdminProfileValidationSchema = z.object({
  name: z.string({ invalid_type_error: "Name must be a string!" }).optional(),
  image: z
    .string({ invalid_type_error: "Image url must be a string!" })
    .optional(),
  phone: z
    .string({ invalid_type_error: "Phone number must be a string!" })
    .optional(),
});

export default updateAdminProfileValidationSchema;
