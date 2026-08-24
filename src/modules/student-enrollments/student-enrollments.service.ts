
import { prisma } from "../../lib/prisma";
import type { CreateEnrollmentInput, GetEnrollmentsQuery, UpdateEnrollmentInput } from "./student-enrollments.validation";


export const createEnrollment = async (
  schoolId: string,
  data: CreateEnrollmentInput
) => {
  // Check student belongs to this school
  const student = await prisma.student.findFirst({
    where: {
      id: data.studentId,
      schoolId,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // Check class belongs to this school
  const classItem = await prisma.class.findFirst({
    where: {
      id: data.classId,
      schoolId,
    },
  });

  if (!classItem) {
    throw new Error("Class not found");
  }

  // Check whether the student is already enrolled
  const existingEnrollment =
    await prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: data.studentId,
          classId: data.classId,
        },
      },
    });

  if (existingEnrollment) {
    throw new Error(
      "Student is already enrolled in this class"
    );
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: data.studentId,
      classId: data.classId,
      schoolId
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
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
  });

  return enrollment;
};



export const getEnrollments = async (
  schoolId: string,
  filters: GetEnrollmentsQuery
) => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      ...(filters.classId && {
        classId: filters.classId,
      }),

      ...(filters.studentId && {
        studentId: filters.studentId,
      }),

      ...(filters.status && {
        status: filters.status,
      }),

      // Make sure the enrollment belongs
      // to the authenticated user's school
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
          status: true,
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

    orderBy: {
      enrolledAt: "desc",
    },
  });

  return enrollments;
};


export const getEnrollmentById = async (
  enrollmentId: string,
  schoolId: string
) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,

      // Make sure the enrollment belongs
      // to the authenticated user's school
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
          address: true,
          status: true,

          user: {
            select: {
              id: true,
              email: true,
            },
          },
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
  });

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  return enrollment;
};


export const updateEnrollment = async (
  enrollmentId: string,
  schoolId: string,
  data: UpdateEnrollmentInput
) => {
  const existingEnrollment =
    await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,

        student: {
          schoolId,
        },
      },
    });

  if (!existingEnrollment) {
    throw new Error("Enrollment not found");
  }

  const updatedEnrollment =
    await prisma.enrollment.update({
      where: {
        id: enrollmentId,
      },
      data: {
        status: data.status,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
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
    });

  return updatedEnrollment;
};