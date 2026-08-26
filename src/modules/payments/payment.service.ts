import { prisma } from "../../lib/prisma";
import type { CreatePaymentInput, GetPaymentsQuery, UpdatePaymentInput } from "./payment.validation";


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

export const updatePayment = async (
  paymentId: string,
  schoolId: string,
  data: UpdatePaymentInput
) => {
  // 1. Find payment and make sure
  //    it belongs to this school
  const existingPayment =
    await prisma.payment.findFirst({
      where: {
        id: paymentId,

        student: {
          schoolId,
        },
      },
    });

  if (!existingPayment) {
    throw new Error("Payment not found");
  }

  // 2. Calculate the final status/paidAt
  const finalStatus =
  data.status ?? existingPayment.status;

const finalPaidAt =
  finalStatus === "PAID"
    ? (data.paidAt ?? existingPayment.paidAt)
    : null;

  // 3. Validate payment consistency
  if (
    finalStatus === "PAID" &&
    !finalPaidAt
  ) {
    throw new Error(
      "paidAt is required when payment is PAID"
    );
  }

  // If payment is no longer PAID,
  // clear paidAt unless explicitly provided.
  if (
    finalStatus !== "PAID" &&
    data.status === "PAID"
  ) {
    // This branch won't normally be reached
    // because finalStatus would be PAID.
  }

  const updatedPayment =
    await prisma.payment.update({
      where: {
        id: paymentId,
      },

        data: {
        ...(data.amount !== undefined && {
            amount: data.amount,
        }),

        ...(data.status !== undefined && {
            status: data.status,
        }),

        ...(data.dueDate !== undefined && {
            dueDate: data.dueDate,
        }),

        paidAt: finalPaidAt,

        ...(data.paymentMethod !== undefined && {
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

  return updatedPayment;
};