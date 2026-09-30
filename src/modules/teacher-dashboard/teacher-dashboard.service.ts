import {
  AttendanceStatus,
  DayOfWeek,
} from "../../../generated/prisma";

import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";

// ----------------------------------------------------
// Shared helpers
// ----------------------------------------------------

const DAYS_OF_WEEK: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

const getDayOfWeek = (date: Date): DayOfWeek => {
  const day = DAYS_OF_WEEK[date.getDay()];

  if (!day) {
    throw new AppError("Invalid day of week", 500);
  }

  return day;
};

const formatDate = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

// ----------------------------------------------------
// 1. STATS & OVERVIEW
// ----------------------------------------------------

export const getTeacherOverviewStats = async (userId: string) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: {
      id: true,
      schoolId: true,
    },
  });

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  const teachingAssignments = await prisma.teachingAssignment.findMany({
    where: {
      teacherId: teacher.id,
      schoolId: teacher.schoolId,
    },
    include: {
      class: {
        include: {
          enrollments: {
            where: {
              status: "ACTIVE",
            },
            select: {
              studentId: true,
            },
          },
        },
      },
    },
  });

  // Unique classes count
  const classIds = new Set(
    teachingAssignments.map((assignment) => assignment.classId)
  );

  const classesCount = classIds.size;

  // Unique subjects count
  const subjectIds = new Set(
    teachingAssignments.map((assignment) => assignment.subjectId)
  );

  const subjectsCount = subjectIds.size;

  // Unique enrolled students count
  const uniqueStudentIds = new Set<string>();

  teachingAssignments.forEach((assignment) => {
    assignment.class.enrollments.forEach((enrollment) => {
      uniqueStudentIds.add(enrollment.studentId);
    });
  });

  const studentsCount = uniqueStudentIds.size;

  // Today's classes count
  const todayDay = getDayOfWeek(new Date());

  const todayClassesCount = await prisma.schedule.count({
    where: {
      dayOfWeek: todayDay,
      teachingAssignment: {
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
      },
    },
  });

  return {
    classesCount,
    studentsCount,
    subjectsCount,
    todayClassesCount,
  };
};

// ----------------------------------------------------
// 2. ATTENDANCE NEEDING ATTENTION
// ----------------------------------------------------

export const getPendingAttendance = async (
  userId: string,
  targetDateStr?: string
) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: {
      id: true,
      schoolId: true,
    },
  });

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  const date = targetDateStr ? new Date(targetDateStr) : new Date();

  if (Number.isNaN(date.getTime())) {
    throw new AppError("Invalid date", 400);
  }

  const dayOfWeek = getDayOfWeek(date);

  // Standardize date to midnight for comparison
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all scheduled slots for this teacher
  const scheduledSlots = await prisma.schedule.findMany({
    where: {
      dayOfWeek,
      teachingAssignment: {
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
      },
    },
    include: {
      teachingAssignment: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const pendingSlots = [];

  for (const slot of scheduledSlots) {
    const recordedAttendance = await prisma.attendance.findFirst({
      where: {
        teachingAssignmentId: slot.teachingAssignmentId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (!recordedAttendance) {
      pendingSlots.push({
        scheduleId: slot.id,
        teachingAssignmentId: slot.teachingAssignmentId,
        className: slot.teachingAssignment.class.name,
        classId: slot.teachingAssignment.class.id,
        subjectName: slot.teachingAssignment.subject.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room ?? "N/A",
        date: formatDate(startOfDay),
        status: "NOT_RECORDED" as const,
      });
    }
  }

  return pendingSlots;
};

export const recordAttendanceBulk = async (
  userId: string,
  data: {
    teachingAssignmentId: string;
    date: string;
    records: Array<{
      studentId: string;
      status: AttendanceStatus;
      note?: string;
    }>;
  }
) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: {
      id: true,
      schoolId: true,
    },
  });

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  const attendanceDate = new Date(data.date);

  if (Number.isNaN(attendanceDate.getTime())) {
    throw new AppError("Invalid attendance date", 400);
  }

  const teachingAssignment =
    await prisma.teachingAssignment.findFirst({
      where: {
        id: data.teachingAssignmentId,
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
      },
      select: {
        id: true,
      },
    });

  if (!teachingAssignment) {
    throw new AppError(
      "Teaching assignment not found or does not belong to this teacher",
      404
    );
  }

  const transactions = data.records.map((record) =>
    prisma.attendance.upsert({
      where: {
        studentId_teachingAssignmentId_date: {
          studentId: record.studentId,
          teachingAssignmentId: data.teachingAssignmentId,
          date: attendanceDate,
        },
      },
      update: {
        status: record.status,
        note: record.note ?? null,
      },
      create: {
        studentId: record.studentId,
        teachingAssignmentId: data.teachingAssignmentId,
        date: attendanceDate,
        status: record.status,
        note: record.note ?? null,
      },
    })
  );

  await prisma.$transaction(transactions);

  return {
    success: true,
    count: data.records.length,
  };
};

// ----------------------------------------------------
// 3. RECENT GRADES
// ----------------------------------------------------

export const getRecentGrades = async (
  userId: string,
  limit = 5
) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: {
      id: true,
      schoolId: true,
    },
  });

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  const grades = await prisma.grade.findMany({
    where: {
      teachingAssignment: {
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
      },
    },
    take: limit,
    orderBy: {
      date: "desc",
    },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      teachingAssignment: {
        include: {
          subject: {
            select: {
              name: true,
            },
          },
          class: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return grades.map((grade) => ({
    id: grade.id,
    studentName: `${grade.student.firstName} ${grade.student.lastName}`,
    subjectName: grade.teachingAssignment.subject.name,
    className: grade.teachingAssignment.class.name,
    type: grade.type,
    grade: grade.value,
    maxGrade: grade.maxValue,
    displayGrade: `${grade.value}/${grade.maxValue}`,
    date: formatDate(grade.date),
    note: grade.note ?? null,
  }));
};

