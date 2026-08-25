import { z } from "zod";

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