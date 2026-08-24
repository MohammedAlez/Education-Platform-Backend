import { z } from "zod";

export const createTeachingAssignmentSchema = z.object({
  teacherId: z.string().min(1),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
});

export const updateTeachingAssignmentSchema = z
  .object({
    teacherId: z.string().min(1).optional(),
    subjectId: z.string().min(1).optional(),
    classId: z.string().min(1).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided",
    }
  );

export type CreateTeachingAssignmentInput =
  z.infer<typeof createTeachingAssignmentSchema>;

export type UpdateTeachingAssignmentInput =
  z.infer<typeof updateTeachingAssignmentSchema>;