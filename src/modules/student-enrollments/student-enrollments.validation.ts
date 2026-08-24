import { z } from "zod";

export const createEnrollmentSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
});

export const updateEnrollmentSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CreateEnrollmentInput = z.infer<
  typeof createEnrollmentSchema
>;

export type UpdateEnrollmentInput = z.infer<
  typeof updateEnrollmentSchema
>;

export const getEnrollmentsQuerySchema = z.object({
  classId: z.string().min(1).optional(),
  studentId: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type GetEnrollmentsQuery = z.infer<
  typeof getEnrollmentsQuerySchema
>;