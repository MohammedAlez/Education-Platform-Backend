import { AppError } from "../../../errors/app-error";
import { prisma } from "../../../lib/prisma";
import type { GetTeacherStudentsQuery } from "../teacher.validation";

export const getTeacherStudents = async (
  schoolId: string,
  userId: string,
  filters: GetTeacherStudentsQuery
) => {
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

  // 2. Find all teaching assignments assigned to this teacher
  const teachingAssignments = await prisma.teachingAssignment.findMany({
    where: {
      teacherId: teacher.id,
      schoolId,
      ...(filters.classId && { classId: filters.classId }),
    },
    select: {
      id: true,
      classId: true,
    },
  });

  if (teachingAssignments.length === 0) {
    return [];
  }

  const assignedClassIds = [
    ...new Set(teachingAssignments.map((ta) => ta.classId)),
  ];
  const teachingAssignmentIds = teachingAssignments.map((ta) => ta.id);

  // 3. Fetch active student enrollments for these assigned classes
  const students = await prisma.student.findMany({
    where: {
      schoolId,
      enrollments: {
        some: {
          classId: { in: assignedClassIds },
          status: "ACTIVE",
        },
      },
      ...(filters.search && {
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName: { contains: filters.search, mode: "insensitive" } },
          {
            enrollments: {
              some: {
                class: {
                  name: { contains: filters.search, mode: "insensitive" },
                },
              },
            },
          },
        ],
      }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      enrollments: {
        where: {
          classId: { in: assignedClassIds },
          status: "ACTIVE",
        },
        select: {
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 1,
      },
      attendance: {
        where: {
          teachingAssignmentId: { in: teachingAssignmentIds },
        },
        select: {
          status: true,
        },
      },
      grades: {
        where: {
          teachingAssignmentId: { in: teachingAssignmentIds },
        },
        select: {
          value: true,
          maxValue: true,
        },
      },
    },
    orderBy: {
      lastName: "asc",
    },
  });

  // 4. Calculate attendance rates and academic averages per student
  return students.map((s) => {
    // Calculate Attendance Rate (% of PRESENT sessions out of total recorded sessions)
    const totalAttendanceSessions = s.attendance.length;
    let attendanceRate = 100; // Default to 100% if no attendance records exist yet

    if (totalAttendanceSessions > 0) {
      const presentCount = s.attendance.filter(
        (att) => att.status === "PRESENT" || att.status === "EXCUSED"
      ).length;
      attendanceRate = Math.round(
        (presentCount / totalAttendanceSessions) * 100
      );
    }

    // Calculate Academic Average (Normalized to /20)
    let academicAverage = 0;
    if (s.grades.length > 0) {
      const normalizedScores = s.grades.map(
        (g) => (g.value / g.maxValue) * 20
      );
      const sum = normalizedScores.reduce((acc, curr) => acc + curr, 0);
      academicAverage = Number((sum / normalizedScores.length).toFixed(1));
    }

    return {
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      class: {
        id: s.enrollments[0]?.class?.id || "",
        name: s.enrollments[0]?.class?.name || "N/A",
      },
      attendanceRate,
      academicAverage,
    };
  });
};