import { AppError } from "../../errors/app-error";
import { prisma } from "../../lib/prisma";
import type { CreateGradeInput, GetGradesQuery, UpdateGradeInput } from "./grade.validation";



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
    throw new AppError(
      "Teaching assignment not found",
      404
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
      throw new AppError(
        "You are not authorized to manage this teaching assignment",
        403
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
    throw new AppError("Student not found", 404);
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
    throw new AppError(
      "Student is not enrolled in this class",
      400
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


// export const getGrades = async (
//   schoolId: string,
//   userId: string,
//   userRole: "ADMIN" | "TEACHER",
//   filters: GetGradesQuery
// ) => {
//   const grades = await prisma.grade.findMany({
//     where: {
//       ...(filters.studentId && {
//         studentId: filters.studentId,
//       }),

//       ...(filters.teachingAssignmentId && {
//         teachingAssignmentId:
//           filters.teachingAssignmentId,
//       }),

//       ...(filters.type && {
//         type: filters.type,
//       }),

//       // Make sure the student belongs
//       // to the authenticated user's school
//       student: {
//         schoolId,
//       },

//       // Teachers can only see grades
//       // from their own assignments
//       ...(userRole === "TEACHER" && {
//         teachingAssignment: {
//           teacher: {
//             userId,
//             schoolId,
//           },
//         },
//       }),
//     },

//     include: {
//       student: {
//         select: {
//           id: true,
//           firstName: true,
//           lastName: true,
//         },
//       },

//       teachingAssignment: {
//         include: {
//           teacher: {
//             select: {
//               id: true,
//               firstName: true,
//               lastName: true,
//             },
//           },

//           subject: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },

//           class: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//         },
//       },
//     },

//     orderBy: {
//       date: "desc",
//     },
//   });

//   return grades;
// };

export const getGradeById = async (
  gradeId: string,
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER"
) => {
  const grade = await prisma.grade.findFirst({
    where: {
      id: gradeId,

      // Grade must belong to the user's school
      student: {
        schoolId,
      },

      // Teacher can only access their assignments
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

  if (!grade) {
    throw new Error("Grade not found");
  }

  return grade;
};

export const updateGrade = async (
  gradeId: string,
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER",
  data: UpdateGradeInput
) => {
  const existingGrade =
    await prisma.grade.findFirst({
      where: {
        id: gradeId,

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
    });

  if (!existingGrade) {
    throw new Error("Grade not found");
  }

  // Calculate the final values after the update
  const finalValue =
    data.value ?? existingGrade.value;

  const finalMaxValue =
    data.maxValue ?? existingGrade.maxValue;

  if (finalValue > finalMaxValue) {
    throw new Error(
      "Value cannot exceed maxValue"
    );
  }

  const updatedGrade =
    await prisma.grade.update({
      where: {
        id: gradeId,
      },

      data: {
        ...(data.type !== undefined && {
          type: data.type,
        }),

        ...(data.value !== undefined && {
          value: data.value,
        }),

        ...(data.maxValue !== undefined && {
          maxValue: data.maxValue,
        }),

        ...(data.date !== undefined && {
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

  return updatedGrade;
};


// Shared Prisma WHERE clause builder
const buildGradeWhereClause = (
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER",
  filters: GetGradesQuery
) => {
  return {
    ...(filters.studentId && { studentId: filters.studentId }),
    ...(filters.teachingAssignmentId && { teachingAssignmentId: filters.teachingAssignmentId }),
    ...(filters.type && { type: filters.type }),
    student: {
      schoolId,
    },
    teachingAssignment: {
      ...(filters.classId && { classId: filters.classId }),
      ...(filters.subjectId && { subjectId: filters.subjectId }),
      ...(filters.teacherId && { teacherId: filters.teacherId }),
      ...(userRole === "TEACHER" && {
        teacher: {
          userId,
          schoolId,
        },
      }),
    },
  };
};

// 1. GET /api/grades
export const getGrades = async (
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER",
  filters: GetGradesQuery
) => {
  return prisma.grade.findMany({
    where: buildGradeWhereClause(schoolId, userId, userRole, filters),
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      teachingAssignment: {
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true } },
          subject: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });
};

// 2. GET /api/grades/stats
export const getGradeStats = async (
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER",
  filters: GetGradesQuery
) => {
  const grades = await prisma.grade.findMany({
    where: buildGradeWhereClause(schoolId, userId, userRole, filters),
    select: {
      studentId: true,
      value: true,
      maxValue: true,
    },
  });

  if (grades.length === 0) {
    return { averageGrade: 0, highestGrade: 0, lowestGrade: 0, studentsBelow10: 0 };
  }

  // Normalize all grades to a 20-point scale
  const normalizedGrades = grades.map((g) => (g.value / g.maxValue) * 20);

  const sum = normalizedGrades.reduce((acc, curr) => acc + curr, 0);
  const averageGrade = Number((sum / normalizedGrades.length).toFixed(1));
  const highestGrade = Number(Math.max(...normalizedGrades).toFixed(1));
  const lowestGrade = Number(Math.min(...normalizedGrades).toFixed(1));

  // Group by student to check overall student average < 10
  const studentMap = new Map<string, number[]>();
  grades.forEach((g) => {
    const norm = (g.value / g.maxValue) * 20;
    const current = studentMap.get(g.studentId) || [];
    studentMap.set(g.studentId, [...current, norm]);
  });

  let studentsBelow10 = 0;
  studentMap.forEach((scores) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < 10) studentsBelow10++;
  });

  return { averageGrade, highestGrade, lowestGrade, studentsBelow10 };
};

// 3. GET /api/grades/student-averages
export const getStudentAverages = async (
  schoolId: string,
  userId: string,
  userRole: "ADMIN" | "TEACHER",
  filters: GetGradesQuery
) => {
  const grades = await prisma.grade.findMany({
    where: buildGradeWhereClause(schoolId, userId, userRole, filters),
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      teachingAssignment: { select: { class: { select: { id: true, name: true } } } },
    },
  });

  const studentMap = new Map<
    string,
    {
      student: { id: string; firstName: string; lastName: string };
      class: { name: string };
      scores: number[];
    }
  >();

  grades.forEach((g) => {
    const normScore = (g.value / g.maxValue) * 20;
    if (!studentMap.has(g.studentId)) {
      studentMap.set(g.studentId, {
        student: g.student,
        class: { name: g.teachingAssignment.class.name },
        scores: [normScore],
      });
    } else {
      studentMap.get(g.studentId)!.scores.push(normScore);
    }
  });

  const getPerformanceStatus = (avg: number) => {
    if (avg >= 16) return "EXCELLENT";
    if (avg >= 14) return "GOOD";
    if (avg >= 10) return "AVERAGE";
    return "NEEDS_IMPROVEMENT";
  };

  const result = Array.from(studentMap.values()).map((entry) => {
    const avg = entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length;
    const averageGrade = Number(avg.toFixed(1));

    return {
      student: entry.student,
      class: entry.class,
      averageGrade,
      status: getPerformanceStatus(averageGrade),
    };
  });

  return result.sort((a, b) => b.averageGrade - a.averageGrade);
};