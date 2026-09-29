import type { DayOfWeek } from "../../../generated/prisma";

import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";

const TIME_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

export function parseTimeToMinutes(timeStr: string): number {
  if (!TIME_REGEX.test(timeStr)) {
    throw new AppError(
      `Invalid time format '${timeStr}'. Expected HH:mm`,
      400
    );
  }

  const [hours, minutes] = timeStr.split(":").map(Number);

  return hours! * 60 + minutes!;
}

// ============================================================
// CONFLICT VALIDATION
// ============================================================

export async function checkScheduleConflict(params: {
  schoolId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  teacherId: string;
  classId: string;
  excludeScheduleId?: string;
}) {
  const newStart = parseTimeToMinutes(params.startTime);
  const newEnd = parseTimeToMinutes(params.endTime);

  if (newStart >= newEnd) {
    throw new AppError(
      "Start time must be strictly before end time",
      400
    );
  }

  const existingSchedules = await prisma.schedule.findMany({
    where: {
      dayOfWeek: params.dayOfWeek,

      ...(params.excludeScheduleId !== undefined && {
        id: {
          not: params.excludeScheduleId,
        },
      }),

      teachingAssignment: {
        schoolId: params.schoolId,

        OR: [
          {
            teacherId: params.teacherId,
          },
          {
            classId: params.classId,
          },
        ],
      },
    },

    include: {
      teachingAssignment: {
        select: {
          teacherId: true,
          classId: true,

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

  for (const slot of existingSchedules) {
    const slotStart = parseTimeToMinutes(slot.startTime);
    const slotEnd = parseTimeToMinutes(slot.endTime);

    // Time overlap:
    // newStart < existingEnd && newEnd > existingStart
    if (newStart < slotEnd && newEnd > slotStart) {
      // Teacher conflict
      if (slot.teachingAssignment.teacherId === params.teacherId) {
        throw new AppError(
          `Teacher conflict: Teacher is already scheduled for ${slot.teachingAssignment.subject.name} in ${slot.teachingAssignment.class.name} between ${slot.startTime} and ${slot.endTime}`,
          409
        );
      }

      // Class conflict
      if (slot.teachingAssignment.classId === params.classId) {
        throw new AppError(
          `Class conflict: ${slot.teachingAssignment.class.name} already has ${slot.teachingAssignment.subject.name} scheduled between ${slot.startTime} and ${slot.endTime}`,
          409
        );
      }
    }
  }
}

// ============================================================
// STUDENT ENDPOINTS
// ============================================================

export const getStudentWeeklySchedule = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: {
      userId,
    },

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

  const schedules = await prisma.schedule.findMany({
    where: {
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
              id: true,
              name: true,
            },
          },

          teacher: {
            select: {
              id: true,
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

  const dayOrder: DayOfWeek[] = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  return dayOrder.map((day) => ({
    day,

    slots: schedules
      .filter((s) => s.dayOfWeek === day)
      .map((s) => ({
        id: s.id,

        subjectId: s.teachingAssignment.subject.id,

        subjectName: s.teachingAssignment.subject.name,

        teacherName: `${s.teachingAssignment.teacher.firstName} ${s.teachingAssignment.teacher.lastName}`,

        startTime: s.startTime,

        endTime: s.endTime,

        room: s.room || "N/A",
      })),
  }));
};

// ============================================================
// TEACHER ENDPOINTS
// ============================================================

export const getTeacherSchedule = async (
  userId: string,
  dayOfWeek?: DayOfWeek
) => {
  const teacher = await prisma.teacher.findUnique({
    where: {
      userId,
    },

    select: {
      id: true,
      schoolId: true,
    },
  });

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  const schedules = await prisma.schedule.findMany({
    where: {
      ...(dayOfWeek !== undefined && {
        dayOfWeek,
      }),

      teachingAssignment: {
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
      },
    },

    include: {
      teachingAssignment: {
        include: {
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

    orderBy: {
      startTime: "asc",
    },
  });

  return schedules.map((s) => ({
    id: s.id,

    teachingAssignmentId: s.teachingAssignmentId,

    dayOfWeek: s.dayOfWeek,

    startTime: s.startTime,

    endTime: s.endTime,

    room: s.room || "N/A",

    subject: {
      id: s.teachingAssignment.subject.id,
      name: s.teachingAssignment.subject.name,
    },

    class: {
      id: s.teachingAssignment.class.id,
      name: s.teachingAssignment.class.name,
    },
  }));
};

// ============================================================
// ADMIN / MANAGEMENT ENDPOINTS
// ============================================================

export const createScheduleSlot = async (
  schoolId: string,

  data: {
    teachingAssignmentId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    room?: string;
  }
) => {
  const ta = await prisma.teachingAssignment.findFirst({
    where: {
      id: data.teachingAssignmentId,
      schoolId,
    },
  });

  if (!ta) {
    throw new AppError("Teaching assignment not found", 404);
  }

  await checkScheduleConflict({
    schoolId,

    dayOfWeek: data.dayOfWeek,

    startTime: data.startTime,

    endTime: data.endTime,

    teacherId: ta.teacherId,

    classId: ta.classId,
  });

  return prisma.schedule.create({
    data: {
      teachingAssignmentId: data.teachingAssignmentId,

      dayOfWeek: data.dayOfWeek,

      startTime: data.startTime,

      endTime: data.endTime,

      ...(data.room !== undefined && {
        room: data.room,
      }),
    },
  });
};

export const deleteScheduleSlot = async (
  schoolId: string,
  scheduleId: string
) => {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleId,

      teachingAssignment: {
        schoolId,
      },
    },
  });

  if (!schedule) {
    throw new AppError("Schedule slot not found", 404);
  }

  await prisma.schedule.delete({
    where: {
      id: scheduleId,
    },
  });

  return {
    success: true,
  };
};