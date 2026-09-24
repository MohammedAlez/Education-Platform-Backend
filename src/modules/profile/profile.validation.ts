import { z } from "zod";

// Admin Profile
export const updateAdminProfileSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().nullable().optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateAdminProfileInput = z.infer<typeof updateAdminProfileSchema>;

// Teacher Profile
export const updateTeacherProfileSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().nullable().optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateTeacherProfileInput = z.infer<
  typeof updateTeacherProfileSchema
>;

// Student Profile
export const updateStudentProfileSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateStudentProfileInput = z.infer<
  typeof updateStudentProfileSchema
>;

// School Profile
export const updateSchoolProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    address: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateSchoolProfileInput = z.infer<
  typeof updateSchoolProfileSchema
>;