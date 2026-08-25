import { prisma } from "../../lib/prisma";
import type { CreateAttendanceInput, GetAttendanceQuery } from "./attendance.validation";



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
    throw new Error("Teaching assignment not found");
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
      throw new Error(
        "You are not authorized to manage this teaching assignment"
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
    throw new Error("Student not found");
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
    throw new Error(
      "Student is not enrolled in this class"
    );
  }

  // 5. Normalize the date
  const attendanceDate = new Date(data.date);

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
    throw new Error(
      "Attendance already exists for this student on this date"
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
    throw new Error("Attendance not found");
  }

  return attendance;
};