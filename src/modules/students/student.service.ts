import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import type { CreateStudentInput, UpdateStudentInput } from "./student.validation";

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

export const getStudents = async (schoolId: string) => {
  const students = await prisma.student.findMany({
    where: {
      schoolId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return students.map((student) => ({
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    phone: student.phone,
    status: student.status,
    user: {
      id: student.user.id,
      email: student.user.email,
      status: student.user.status,
    },
    createdAt: student.createdAt,
  }));
};

export const getStudentById = async (
  studentId: string,
  schoolId: string
) => {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          status: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    phone: student.phone,
    status: student.status,
    user: {
      id: student.user.id,
      email: student.user.email,
      status: student.user.status,
    },
    createdAt: student.createdAt,
  };
};


export const updateStudent = async (
  studentId: string,
  schoolId: string,
  data: UpdateStudentInput
) => {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId,
    },
    include: {
      user: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // Check email uniqueness if email is being changed
  if (data.email && data.email !== student.user.email) {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      throw new Error("Email is already registered");
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedStudent = await tx.student.update({
      where: {
        id: student.id,
      },
      data: {
        ...(data.firstName !== undefined && {
          firstName: data.firstName,
        }),

        ...(data.lastName !== undefined && {
          lastName: data.lastName,
        }),

        ...(data.phone !== undefined && {
          phone: data.phone,
        }),

        ...(data.status !== undefined && {
          status: data.status,
        }),
      },
    });

    const updatedUser = await tx.user.update({
      where: {
        id: student.userId,
      },
      data: {
        ...(data.email !== undefined && {
          email: data.email,
        }),

        ...(data.status !== undefined && {
          status: data.status,
        }),
      },
    });

    return {
      student: updatedStudent,
      user: updatedUser,
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

    createdAt: result.student.createdAt,
  };
};