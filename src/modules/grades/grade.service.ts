import { prisma } from "../../lib/prisma";
import type { CreateGradeInput, GetGradesQuery } from "./grade.validation";



export const createGrade = async (
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER",
  data: CreateGradeInput
) => {
  // 1. Find teaching assignment
  const teachingAssignment =
    await prisma.teachingAssignment.findFirst({
      where: {
        id: data.teachingAssignmentId,

        class: {
          schoolId,
        },
      },
    });

  if (!teachingAssignment) {
    throw new Error(
      "Teaching assignment not found"
    );
  }

  // 2. Teacher can only create grades
  //    for their own assignments
  if (userRole === "TEACHER") {
    const teacher =
      await prisma.teacher.findFirst({
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

  // 3. Find student
  const student =
    await prisma.student.findFirst({
      where: {
        id: data.studentId,
        schoolId,
      },
    });

  if (!student) {
    throw new Error("Student not found");
  }

  // 4. Student must be enrolled
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

  // 5. Create grade
  const grade = await prisma.grade.create({
    data: {
      studentId: data.studentId,

      teachingAssignmentId:
        data.teachingAssignmentId,

      type: data.type,

      value: data.value,

      maxValue: data.maxValue,

      ...(data.date && {
        date: data.date,
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

  return grade;
};


export const getGrades = async (
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER",
  filters: GetGradesQuery
) => {
  const grades = await prisma.grade.findMany({
    where: {
      ...(filters.studentId && {
        studentId: filters.studentId,
      }),

      ...(filters.teachingAssignmentId && {
        teachingAssignmentId:
          filters.teachingAssignmentId,
      }),

      ...(filters.type && {
        type: filters.type,
      }),

      // Make sure the student belongs
      // to the authenticated user's school
      student: {
        schoolId,
      },

      // Teachers can only see grades
      // from their own assignments
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

    orderBy: {
      date: "desc",
    },
  });

  return grades;
};