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