import { z } from "zod";

export const createPaymentSchema = z.object({
  studentId: z.string().min(1),

  amount: z
    .number()
    .positive(),

  status: z
    .enum([
      "PENDING",
      "PAID",
      "OVERDUE",
      "CANCELLED",
    ])
    .default("PENDING"),

  dueDate: z.coerce.date().optional(),

  paidAt: z.coerce.date().optional(),

  paymentMethod: z
    .enum([
      "CASH",
      "BANK_TRANSFER",
      "CCP",
      "OTHER",
    ])
    .optional(),

  note: z
    .string()
    .max(500)
    .optional(),
});

export type CreatePaymentInput = z.infer<
  typeof createPaymentSchema
>;

export const getPaymentsQuerySchema = z.object({
  studentId: z.string().min(1).optional(),

  status: z
    .enum([
      "PENDING",
      "PAID",
      "OVERDUE",
      "CANCELLED",
    ])
    .optional(),
});

export type GetPaymentsQuery = z.infer<
  typeof getPaymentsQuerySchema
>;

export const updatePaymentSchema = z
  .object({
    amount: z
      .number()
      .positive()
      .optional(),

    status: z
      .enum([
        "PENDING",
        "PAID",
        "OVERDUE",
        "CANCELLED",
      ])
      .optional(),

    dueDate: z.coerce.date().nullable().optional(),

    paidAt: z.coerce.date().nullable().optional(),

    paymentMethod: z
      .enum([
        "CASH",
        "BANK_TRANSFER",
        "CCP",
        "OTHER",
      ])
      .nullable()
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

export type UpdatePaymentInput = z.infer<
  typeof updatePaymentSchema
>;