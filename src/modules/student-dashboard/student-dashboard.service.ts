import { DayOfWeek } from "../../../generated/prisma";

import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";

const DAYS_OF_WEEK: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

const getTodayDayOfWeek = (): DayOfWeek => {
  const day = DAYS_OF_WEEK[new Date().getDay()];

  if (!day) {
    throw new AppError("Invalid day of week", 500);
  }

  return day;
};

// ----------------------------------------------------
// 1. STUDENT OVERVIEW METRICS
// ----------------------------------------------------

export const getStudentOverviewStats = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true, schoolId: true },
  });

  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: student.id,
      status: "ACTIVE",
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!enrollment) {
    return {
      className: "N/A",
      averageGrade: "0.0 / 20",
      attendanceRate: "0%",
      subjectsCount: 0,
      attendanceSummary: {
        present: 0,
        absent: 0,
        late: 0,
      },
    };
  }

  const subjectsCount = await prisma.teachingAssignment.count({
    where: {
      classId: enrollment.classId,
      schoolId: student.schoolId,
    },
  });

  const grades = await prisma.grade.findMany({
    where: {
      studentId: student.id,
    },
    select: {
      value: true,
      maxValue: true,
    },
  });

  let averageGrade = "N/A";

  if (grades.length > 0) {
    const totalNormalized = grades.reduce((acc, grade) => {
      const normalizedScore = (grade.value / grade.maxValue) * 20;
      return acc + normalizedScore;
    }, 0);

    const average = totalNormalized / grades.length;
    averageGrade = `${average.toFixed(1)} / 20`;
  }

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      studentId: student.id,
    },
    select: {
      status: true,
    },
  });

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  attendanceRecords.forEach((record) => {
    if (record.status === "PRESENT") {
      presentCount++;
    } else if (record.status === "ABSENT") {
      absentCount++;
    } else if (record.status === "LATE") {
      lateCount++;
    }
  });

  const totalAttendance = attendanceRecords.length;

  const attendanceRate =
    totalAttendance > 0
      ? `${Math.round(
          ((presentCount + lateCount) / totalAttendance) * 100
        )}%`
      : "100%";

  return {
    className: enrollment.class.name,
    averageGrade,
    attendanceRate,
    subjectsCount,
    attendanceSummary: {
      present: presentCount,
      absent: absentCount,
      late: lateCount,
    },
  };
};

// ----------------------------------------------------
// 2. TODAY'S CLASSES
// ----------------------------------------------------

export const getStudentTodayClasses = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      id: true,
      schoolId: true,
    },
  });

  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: student.id,
      status: "ACTIVE",
    },
    select: {
      classId: true,
    },
  });

  if (!enrollment) {
    return [];
  }

  const todayDay = getTodayDayOfWeek();

  const schedules = await prisma.schedule.findMany({
    where: {
      dayOfWeek: todayDay,
      teachingAssignment: {
        classId: enrollment.classId,
        schoolId: student.schoolId,
      },
    },
    include: {
      teachingAssignment: {
        include: {
          subject: {
            select: {
              name: true,
            },
          },
          teacher: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return schedules.map((schedule) => ({
    id: schedule.id,
    subjectName: schedule.teachingAssignment.subject.name,
    room: schedule.room ?? "N/A",
    teacherName: `${schedule.teachingAssignment.teacher.firstName} ${schedule.teachingAssignment.teacher.lastName}`,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
  }));
};

// ----------------------------------------------------
// 3. RECENT GRADES
// ----------------------------------------------------

export const getStudentRecentGrades = async (
  userId: string,
  limit = 5
) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      id: true,
    },
  });

  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  const grades = await prisma.grade.findMany({
    where: {
      studentId: student.id,
    },
    take: limit,
    orderBy: {
      date: "desc",
    },
    include: {
      teachingAssignment: {
        include: {
          subject: {
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
    subjectName: grade.teachingAssignment.subject.name,
    grade: grade.value,
    maxGrade: grade.maxValue,
    displayGrade: `${grade.value}/${grade.maxValue}`,
    date: grade.date.toISOString().split("T")[0],
  }));
};