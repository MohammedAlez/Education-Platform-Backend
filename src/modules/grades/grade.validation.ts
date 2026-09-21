import { z } from "zod";
import { GradeType } from "../../../generated/prisma";

export const createGradeSchema = z
  .object({
    studentId: z.string().min(1),

    teachingAssignmentId: z
      .string()
      .min(1),

    type: z.enum([
      "QUIZ",
      "ASSIGNMENT",
      "TEST",
      "EXAM",
    ]),

    value: z.number().min(0),

    maxValue: z
      .number()
      .positive()
      .default(20),

    date: z.coerce.date().optional(),

    note: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.value <= data.maxValue,
    {
      message: "Value cannot exceed maxValue",
      path: ["value"],
    }
  );

export type CreateGradeInput = z.infer<
  typeof createGradeSchema
>;

export const getGradesQuerySchema = z.object({
  studentId: z.string().optional(),
  teachingAssignmentId: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
  type: z.nativeEnum(GradeType).optional(),
});

export type GetGradesQuery = z.infer<
  typeof getGradesQuerySchema
>;


export const updateGradeSchema = z
  .object({
    type: z
      .enum([
        "QUIZ",
        "ASSIGNMENT",
        "TEST",
        "EXAM",
      ])
      .optional(),

    value: z.number().min(0).optional(),

    maxValue: z.number().positive().optional(),

    date: z.coerce.date().optional(),

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

export type UpdateGradeInput = z.infer<
  typeof updateGradeSchema
>;



export const bulkUpdateGradeItemSchema = z
  .object({
    id: z.string().min(1, "Grade ID is required"),
    type: z.nativeEnum(GradeType).optional(),
    value: z.number().min(0).optional(),
    maxValue: z.number().positive().optional(),
    date: z.coerce.date().optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.value !== undefined && data.maxValue !== undefined) {
        return data.value <= data.maxValue;
      }
      return true;
    },
    {
      message: "Value cannot exceed maxValue",
      path: ["value"],
    }
  );

export const bulkUpdateGradeSchema = z.object({
  records: z
    .array(bulkUpdateGradeItemSchema)
    .min(1, "At least one grade record must be provided"),
});

export type BulkUpdateGradeInput = z.infer<typeof bulkUpdateGradeSchema>;