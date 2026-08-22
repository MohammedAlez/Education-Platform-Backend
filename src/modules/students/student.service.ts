import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import type { CreateStudentInput } from "./student.validation";

export const createStudent = async (
  data: CreateStudentInput,
  schoolId: string
) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(
    data.password,
    12
  );

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: "STUDENT",
        status: "ACTIVE",
        schoolId,
      },
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        schoolId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        status: "ACTIVE",
      },
    });

    return {
      user,
      student,
    };
  });

  return {
    id: result.student.id,
    firstName: result.student.firstName,
    lastName: result.student.lastName,
    phone: result.student.phone,
    status: result.student.status,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      status: result.user.status,
    },
  };
};