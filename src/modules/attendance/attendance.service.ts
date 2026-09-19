import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import type { BulkUpdateAttendanceInput, CreateAttendanceInput, GetAttendanceQuery, UpdateAttendanceInput } from "./attendance.validation";



export const createAttendance = async (
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER",
  data: CreateAttendanceInput
) => {
  // 1. Find the teaching assignment
  const teachingAssignment =
    await prisma.teachingAssignment.findFirst({
      where: {
        id: data.teachingAssignmentId,

        // Make sure the assignment belongs
        // to the authenticated user's school
        class: {
          schoolId,
        },
      },
    });

  if (!teachingAssignment) {
    throw new AppError("Teaching assignment not found", 404);
  }

  // 2. If teacher, make sure this is their assignment
  if (userRole === "TEACHER") {
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId,
        id: teachingAssignment.teacherId,
        schoolId,
      },
    });

    if (!teacher) {
      throw new AppError(
        "You are not authorized to manage this teaching assignment",
        403
      );
    }
  }

  // 3. Find the student and make sure they belong
  //    to the same school
  const student = await prisma.student.findFirst({
    where: {
      id: data.studentId,
      schoolId,
    },
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  // 4. Make sure the student is enrolled
  //    in the assignment's class
  const enrollment =
    await prisma.enrollment.findFirst({
      where: {
        studentId: data.studentId,
        classId: teachingAssignment.classId,
        status: "ACTIVE",
      },
    });

  if (!enrollment) {
    throw new AppError(
      "Student is not enrolled in this class",
      400
    );
  }

  // 5. Normalize the date
  const attendanceDate = new Date(data.date);

  if (isNaN(attendanceDate.getTime())) {
    throw new AppError("Invalid date provided", 400);
  }

  attendanceDate.setHours(0, 0, 0, 0);

  // 6. Check for existing attendance
  const existingAttendance =
    await prisma.attendance.findUnique({
      where: {
        studentId_teachingAssignmentId_date: {
          studentId: data.studentId,
          teachingAssignmentId:
            data.teachingAssignmentId,
          date: attendanceDate,
        },
      },
    });

  if (existingAttendance) {
    throw new AppError(
      "Attendance already exists for this student on this date",
      409
    );
  }

  // 7. Create attendance
  const attendance =
    await prisma.attendance.create({
      data: {
        studentId: data.studentId,
        teachingAssignmentId:
          data.teachingAssignmentId,
        date: attendanceDate,
        status: data.status,
        note: data?.note || null,
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
    });

  return attendance;
};


export const getAttendance = async (
  schoolId: string,
  filters: GetAttendanceQuery
) => {
  let dateFilter;

  if (filters.date) {
    const startOfDay = new Date(filters.date);

    if (isNaN(startOfDay.getTime())) {
      throw new AppError("Invalid date provided", 400);
    }

    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    dateFilter = {
      gte: startOfDay,
      lt: endOfDay,
    };
  }

  const attendance = await prisma.attendance.findMany({
    where: {
      ...(filters.studentId && {
        studentId: filters.studentId,
      }),

      ...(filters.teachingAssignmentId && {
        teachingAssignmentId:
          filters.teachingAssignmentId,
      }),

      ...(filters.status && {
        status: filters.status,
      }),

      ...(dateFilter && {
        date: dateFilter,
      }),

      // Scope attendance to the authenticated
      // user's school
      student: {
        schoolId,
      },
    },

    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
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

    orderBy: [
      {
        date: "desc",
      },
    ],
  });

  return attendance;
};


export const getAttendanceById = async (
  attendanceId: string,
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER"
) => {
  const attendance =
    await prisma.attendance.findFirst({
      where: {
        id: attendanceId,

        // Attendance must belong to the user's school
        student: {
          schoolId,
        },

        // Teachers can only access their own assignments
        ...(userRole === "TEACHER" && {
          teachingAssignment: {
            teacher: {
              userId,
              schoolId,
            },
          },
        }),
      },

      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,

            user: {
              select: {
                id: true,
                email: true,
              },
            },
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
                description: true,
              },
            },

            class: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

  if (!attendance) {
    throw new AppError("Attendance record not found", 404);
  }

  return attendance;
};


export const updateAttendance = async (
  attendanceId: string,
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER",
  data: UpdateAttendanceInput
) => {
  const attendance =
    await prisma.attendance.findFirst({
      where: {
        id: attendanceId,

        // Attendance must belong to this school
        student: {
          schoolId,
        },

        // Teachers can only update
        // their own teaching assignments
        ...(userRole === "TEACHER" && {
          teachingAssignment: {
            teacher: {
              userId,
              schoolId,
            },
          },
        }),
      },
    });

  if (!attendance) {
    throw new AppError("Attendance record not found", 404);
  }

  const updatedAttendance =
    await prisma.attendance.update({
      where: {
        id: attendanceId,
      },

      data: {
        ...(data.status !== undefined && {
          status: data.status,
        }),

        ...(data.note !== undefined && {
          note: data.note,
        }),
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
    });

  return updatedAttendance;
};

export const bulkUpdateAttendance = async (
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER",
  data: BulkUpdateAttendanceInput
) => {
  const attendanceIds = data.records.map((item) => item.id);

  // 1. Retrieve all requested attendance records that pass ownership/role filters
  const existingRecords = await prisma.attendance.findMany({
    where: {
      id: { in: attendanceIds },
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
    },
  });

  // Verify that all requested IDs exist and are authorized for this user
  if (existingRecords.length !== attendanceIds.length) {
    const foundIds = new Set(existingRecords.map((r) => r.id));
    const unauthorizedOrMissingIds = attendanceIds.filter(
      (id) => !foundIds.has(id)
    );

    throw new AppError(
      `Unauthorized or non-existent attendance records: ${unauthorizedOrMissingIds.join(", ")}`,
      403
    );
  }

  // 2. Perform updates inside a Prisma transaction
  const updatedRecords = await prisma.$transaction(async (tx) => {
    const updatePromises = data.records.map((record) =>
      tx.attendance.update({
        where: { id: record.id },
        data: {
          ...(record.status !== undefined && { status: record.status }),
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
            select: {
              id: true,
              subject: {
                select: { id: true, name: true },
              },
              class: {
                select: { id: true, name: true },
              },
            },
          },
        },
      })
    );

    return Promise.all(updatePromises);
  });

  return updatedRecords;
};