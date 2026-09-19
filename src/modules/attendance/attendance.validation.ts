import { z } from "zod";
import { AttendanceStatus } from "../../../generated/prisma";

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

export const updateAttendanceSchema = z
  .object({
    status: z
      .enum([
        "PRESENT",
        "ABSENT",
        "LATE",
        "EXCUSED",
      ])
      .optional(),

    note: z
      .string()
      .max(500)
      .nullable()
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided",
    }
  );

export type UpdateAttendanceInput = z.infer<
  typeof updateAttendanceSchema
>;



export const bulkUpdateAttendanceItemSchema = z.object({
  id: z.string().min(1, "Attendance ID is required"),
  status: z.nativeEnum(AttendanceStatus).optional(),
  note: z.string().optional().nullable(),
});

export const bulkUpdateAttendanceSchema = z.object({
  records: z
    .array(bulkUpdateAttendanceItemSchema)
    .min(1, "At least one attendance record must be provided"),
});

export type BulkUpdateAttendanceInput = z.infer<typeof bulkUpdateAttendanceSchema>;