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