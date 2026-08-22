import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import type { CreateTeacherInput } from "./teacher.validation";

export const createTeacher = async (
  data: CreateTeacherInput,
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

  const passwordHash = await bcrypt.hash(data.password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: "TEACHER",
        status: "ACTIVE",
        schoolId,
      },
    });

    const teacher = await tx.teacher.create({
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
      teacher,
    };
  });

  return {
    id: result.teacher.id,
    firstName: result.teacher.firstName,
    lastName: result.teacher.lastName,
    phone: result.teacher.phone,
    status: result.teacher.status,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      status: result.user.status,
    },
  };
};