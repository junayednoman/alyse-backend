import { z } from "zod";

export const TeacherValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  roomNumber: z.string().min(1, "Room number is required"),
  school: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid school ID format",
  }),
  district: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid district ID format",
  }),
});


export const UpdateTeacherValidationSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  password: z.string().min(6, "Password must be at least 6 characters long").optional(),
  roomNumber: z.string().min(1, "Room number is required").optional(),
  school: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid school ID format",
  }).optional(),
  district: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid district ID format",
  }).optional(),
});