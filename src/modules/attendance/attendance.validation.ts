import { z } from "zod";

export const createAttendanceSchema = z.object({
  studentId: z.string().min(1),
  teachingAssignmentId: z.string().min(1),
  date: z.coerce.date(),
  status: z.enum([
    "PRESENT",
    "ABSENT",
    "LATE",
    "EXCUSED",
  ]),
  note: z.string().max(500).optional(),
});

export type CreateAttendanceInput = z.infer<
  typeof createAttendanceSchema
>;


export const getAttendanceQuerySchema = z.object({
  studentId: z.string().min(1).optional(),

  teachingAssignmentId: z.string().min(1).optional(),

  status: z
    .enum([
      "PRESENT",
      "ABSENT",
      "LATE",
      "EXCUSED",
    ])
    .optional(),

  date: z.coerce.date().optional(),
});

export type GetAttendanceQuery = z.infer<
  typeof getAttendanceQuerySchema
>;