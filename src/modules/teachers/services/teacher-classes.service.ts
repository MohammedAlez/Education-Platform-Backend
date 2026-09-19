import { AppError } from "../../../errors/app-error";
import { prisma } from "../../../lib/prisma";

export const getTeacherClasses = async (schoolId: string, userId: string) => {
  // 1. Locate the Teacher record associated with the authenticated user
  const teacher = await prisma.teacher.findFirst({
    where: {
      userId,
      schoolId,
    },
    select: { id: true },
  });

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  // 2. Fetch all teaching assignments for this teacher with class and subject details
  const teachingAssignments = await prisma.teachingAssignment.findMany({
    where: {
      teacherId: teacher.id,
      schoolId,
    },
    select: {
      class: {
        select: {
          id: true,
          name: true,
          description: true,
          _count: {
            select: {
              enrollments: {
                where: {
                  status: "ACTIVE",
                },
              },
            },
          },
        },
      },
      subject: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // 3. Deduplicate classes (a teacher may teach multiple subjects to the same class)
  const classMap = new Map<
    string,
    {
      id: string;
      name: string;
      description: string | null;
      studentsCount: number;
      subjects: { id: string; name: string }[];
    }
  >();

  teachingAssignments.forEach((ta) => {
    const classId = ta.class.id;

    if (!classMap.has(classId)) {
      classMap.set(classId, {
        id: ta.class.id,
        name: ta.class.name,
        description: ta.class.description,
        studentsCount: ta.class._count.enrollments,
        subjects: [ta.subject],
      });
    } else {
      const existing = classMap.get(classId)!;
      // Prevent duplicate subject entries
      if (!existing.subjects.some((s) => s.id === ta.subject.id)) {
        existing.subjects.push(ta.subject);
      }
    }
  });

  return Array.from(classMap.values());
};