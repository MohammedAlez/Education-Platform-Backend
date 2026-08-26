import { prisma } from "../../lib/prisma";
import type { CreatePaymentInput, GetPaymentsQuery } from "./payment.validation";


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


export const getPayments = async (
  schoolId: string,
  filters: GetPaymentsQuery
) => {
  const payments =
    await prisma.payment.findMany({
      where: {
        ...(filters.studentId && {
          studentId: filters.studentId,
        }),

        ...(filters.status && {
          status: filters.status,
        }),

        // Make sure the payment belongs
        // to a student in this school
        student: {
          schoolId,
        },
      },

      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return payments;
};

export const getPaymentById = async (
  paymentId: string,
  schoolId: string
) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,

      // Payment must belong to a student
      // in the authenticated admin's school
      student: {
        schoolId,
      },
    },

    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
          status: true,

          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
};