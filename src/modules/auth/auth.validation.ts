import { z } from "zod";

export const registerSchoolSchema = z.object({
  school: z.object({
    name: z.string().trim().min(2).max(100),
    address: z.string().trim().min(2).max(255),
    phone: z.string().trim().min(8).max(20),
    email: z.string().trim().email(),
  }),

  admin: z.object({
    firstName: z.string().trim().min(2).max(50),
    lastName: z.string().trim().min(2).max(50),
    email: z.string().trim().email(),
    password: z.string().min(8).max(100),
  }),
});

export type RegisterSchoolInput = z.infer<
  typeof registerSchoolSchema
>;