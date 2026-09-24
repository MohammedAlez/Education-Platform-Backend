import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import type {
  UpdateAdminProfileInput,
  UpdateSchoolProfileInput,
  UpdateStudentProfileInput,
  UpdateTeacherProfileInput,
} from "./profile.validation";

// Helper to update email if provided and check uniqueness
const handleEmailUpdate = async (
  userId: string,
  newEmail?: string,
  tx?: any
) => {
  if (!newEmail) return;

  const db = tx || prisma;

  const existing = await db.user.findUnique({
    where: { email: newEmail },
  });

  if (existing && existing.id !== userId) {
    throw new AppError("Email is already in use", 409);
  }

  await db.user.update({
    where: { id: userId },
    data: { email: newEmail },
  });
};

// 1. Update Admin Profile (Admin updates own profile or another Admin)
export const updateAdminProfile = async (
  adminId: string,
  schoolId: string,
  data: UpdateAdminProfileInput
) => {
  const admin = await prisma.admin.findFirst({
    where: { id: adminId, schoolId },
    select: { id: true, userId: true },
  });

  if (!admin) {
    throw new AppError("Admin profile not found", 404);
  }

  return await prisma.$transaction(async (tx) => {
    if (data.email) {
      await handleEmailUpdate(admin.userId, data.email, tx);
    }

    return await tx.admin.update({
      where: { id: admin.id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      include: {
        user: { select: { email: true, role: true, status: true } },
      },
    });
  });
};

// 2. Update Teacher Profile
export const updateTeacherProfile = async (
  teacherId: string,
  schoolId: string,
  data: UpdateTeacherProfileInput
) => {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, schoolId },
    select: { id: true, userId: true },
  });

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  return await prisma.$transaction(async (tx) => {
    if (data.email) {
      await handleEmailUpdate(teacher.userId, data.email, tx);
    }

    return await tx.teacher.update({
      where: { id: teacher.id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      include: {
        user: { select: { email: true, role: true, status: true } },
      },
    });
  });
};

// 3. Update Student Profile
export const updateStudentProfile = async (
  studentId: string,
  schoolId: string,
  data: UpdateStudentProfileInput
) => {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    select: { id: true, userId: true },
  });

  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  return await prisma.$transaction(async (tx) => {
    if (data.email) {
      await handleEmailUpdate(student.userId, data.email, tx);
    }

    return await tx.student.update({
      where: { id: student.id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
      },
      include: {
        user: { select: { email: true, role: true, status: true } },
      },
    });
  });
};

// 4. Update School Profile
export const updateSchoolProfile = async (
  schoolId: string,
  data: UpdateSchoolProfileInput
) => {
  if (data.email) {
    const existingSchool = await prisma.school.findUnique({
      where: { email: data.email },
    });

    if (existingSchool && existingSchool.id !== schoolId) {
      throw new AppError("School email is already in use", 409);
    }
  }

  return await prisma.school.update({
    where: { id: schoolId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
    },
  });
};