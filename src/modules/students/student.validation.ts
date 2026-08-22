import { z } from "zod";

export const createStudentSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8).max(20),
  password: z.string().min(8).max(100),
});

export type CreateStudentInput = z.infer<
  typeof createStudentSchema
>;

export const updateStudentSchema = z
  .object({
    firstName: z.string().trim().min(2).max(50).optional(),
    lastName: z.string().trim().min(2).max(50).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(8).max(20).optional(),
    status: z
      .enum(["ACTIVE", "INACTIVE"])
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided",
    }
  );

export type UpdateStudentInput = z.infer<
  typeof updateStudentSchema
>;