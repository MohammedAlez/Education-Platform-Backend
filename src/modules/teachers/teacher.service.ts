import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import type { CreateTeacherInput, UpdateTeacherInput } from "./teacher.validation";

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


export const getTeachers = async (schoolId: string) => {
  const teachers = await prisma.teacher.findMany({
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

  return teachers.map((teacher) => ({
    id: teacher.id,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    phone: teacher.phone,
    status: teacher.status,
    user: {
      id: teacher.user.id,
      email: teacher.user.email,
      status: teacher.user.status,
    },
    createdAt: teacher.createdAt,
  }));
};


export const getTeacherById = async (
  teacherId: string,
  schoolId: string
) => {
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
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

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  return {
    id: teacher.id,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    phone: teacher.phone,
    status: teacher.status,
    user: {
      id: teacher.user.id,
      email: teacher.user.email,
      status: teacher.user.status,
    },
    createdAt: teacher.createdAt,
  };
};


export const updateTeacher = async (
  teacherId: string,
  schoolId: string,
  data: UpdateTeacherInput
) => {
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      schoolId,
    },
    include: {
      user: true,
    },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  // Check whether the new email is already used
  if (data.email && data.email !== teacher.user.email) {
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
    const updatedTeacher = await tx.teacher.update({
      where: {
        id: teacher.id,
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
        id: teacher.userId,
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
      teacher: updatedTeacher,
      user: updatedUser,
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

    createdAt: result.teacher.createdAt,
  };
};