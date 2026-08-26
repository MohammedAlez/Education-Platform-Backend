import { prisma } from "../../lib/prisma";
import type { CreatePaymentInput } from "./payment.validation";


export const createPayment = async (
  schoolId: string,
  data: CreatePaymentInput
) => {
  // 1. Make sure the student belongs
  //    to the authenticated user's school
  const student =
    await prisma.student.findFirst({
      where: {
        id: data.studentId,
        schoolId,
      },
    });

  if (!student) {
    throw new Error("Student not found");
  }

  // 2. Validate payment status
  if (data.status === "PAID" && !data.paidAt) {
    throw new Error(
      "paidAt is required when payment is PAID"
    );
  }

  // 3. paidAt only makes sense for PAID payments
  if (
    data.status !== "PAID" &&
    data.paidAt
  ) {
    throw new Error(
      "paidAt can only be provided for PAID payments"
    );
  }

  // 4. Create payment
  const payment =
    await prisma.payment.create({
      data: {
        studentId: data.studentId,

        amount: data.amount,

        status: data.status,

        ...(data.dueDate && {
          dueDate: data.dueDate,
        }),

        ...(data.paidAt && {
          paidAt: data.paidAt,
        }),

        ...(data.paymentMethod && {
          paymentMethod: data.paymentMethod,
        }),

        ...(data.note !== undefined && {
          note: data.note,
        }),
      },

      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

  return payment;
};