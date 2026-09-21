import { AppError } from "../../../errors/app-error";
import { prisma } from "../../../lib/prisma";
import type { BulkUpdateGradeInput } from "../grade.validation";

export const bulkUpdateGrade = async (
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER",
  data: BulkUpdateGradeInput
) => {
  const gradeIds = data.records.map((item) => item.id);

  // 1. Fetch existing records to check ownership and existing values for validation
  const existingGrades = await prisma.grade.findMany({
    where: {
      id: { in: gradeIds },
      student: {
        schoolId,
      },
      ...(userRole === "TEACHER" && {
        teachingAssignment: {
          teacher: {
            userId,
            schoolId,
          },
        },
      }),
    },
    select: {
      id: true,
      value: true,
      maxValue: true,
    },
  });

  // Verify that all requested IDs exist and are authorized for this user
  if (existingGrades.length !== gradeIds.length) {
    const foundIds = new Set(existingGrades.map((g) => g.id));
    const unauthorizedOrMissingIds = gradeIds.filter((id) => !foundIds.has(id));

    throw new AppError(
      `Unauthorized or non-existent grade records: ${unauthorizedOrMissingIds.join(", ")}`,
      403
    );
  }

  // Create a fast lookup map for existing grade values
  const existingMap = new Map(existingGrades.map((g) => [g.id, g]));

  // 2. Validate value vs maxValue against existing DB records
  for (const record of data.records) {
    const existing = existingMap.get(record.id)!;
    const finalValue = record.value ?? existing.value;
    const finalMaxValue = record.maxValue ?? existing.maxValue;

    if (finalValue > finalMaxValue) {
      throw new AppError(
        `Grade ID ${record.id}: value (${finalValue}) cannot exceed maxValue (${finalMaxValue})`,
        400
      );
    }
  }

  // 3. Execute bulk updates in a transaction
  const updatedGrades = await prisma.$transaction(async (tx) => {
    const updatePromises = data.records.map((record) =>
      tx.grade.update({
        where: { id: record.id },
        data: {
          ...(record.type !== undefined && { type: record.type }),
          ...(record.value !== undefined && { value: record.value }),
          ...(record.maxValue !== undefined && { maxValue: record.maxValue }),
          ...(record.date !== undefined && { date: record.date }),
          ...(record.note !== undefined && { note: record.note }),
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          teachingAssignment: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              subject: {
                select: {
                  id: true,
                  name: true,
                },
              },
              class: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })
    );

    return Promise.all(updatePromises);
  });

  return updatedGrades;
};