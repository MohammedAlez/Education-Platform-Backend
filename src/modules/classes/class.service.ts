import { prisma } from "../../lib/prisma";
import type { CreateClassInput, UpdateClassInput } from "./class.validation";


export const createClass = async (
  schoolId: string,
  data: CreateClassInput
) => {
  const existingClass = await prisma.class.findFirst({
    where: {
      schoolId,
      name: data.name,
    },
  });

  if (existingClass) {
    throw new Error("Class already exists");
  }

  const newClass = await prisma.class.create({
    data: {
      schoolId,
      name: data.name,
      ...(data.description && {description: data.description})
    },
  });

  return newClass;
};



export const getClasses = async (schoolId: string) => {
  const classes = await prisma.class.findMany({
    where: {
      schoolId,
    },
    include: {
      _count: {
        select: {
          enrollments: true,
          teachingAssignments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return classes.map((classItem) => ({
    id: classItem.id,
    name: classItem.name,
    description: classItem.description,
    studentCount: classItem._count.enrollments,
    teachingAssignmentCount:
      classItem._count.teachingAssignments,
    createdAt: classItem.createdAt,
    updatedAt: classItem.updatedAt,
  }));
};


export const getClassById = async (
  classId: string,
  schoolId: string
) => {
  const classItem = await prisma.class.findFirst({
    where: {
      id: classId,
      schoolId,
    },
    include: {
      enrollments: {
        where: {
          status: "ACTIVE",
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
        },
        orderBy: {
          enrolledAt: "desc",
        },
      },

      teachingAssignments: {
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              status: true,
            },
          },
          subject: {
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

  if (!classItem) {
    throw new Error("Class not found");
  }

  return {
    id: classItem.id,
    name: classItem.name,
    description: classItem.description,

    students: classItem.enrollments.map(
      (enrollment) => ({
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        student: enrollment.student,
      })
    ),

    teachingAssignments:
      classItem.teachingAssignments.map(
        (assignment) => ({
          id: assignment.id,
          teacher: assignment.teacher,
          subject: assignment.subject,
          createdAt: assignment.createdAt,
        })
      ),

    createdAt: classItem.createdAt,
    updatedAt: classItem.updatedAt,
  };
};


export const updateClass = async (
  classId: string,
  schoolId: string,
  data: UpdateClassInput
) => {
  // Make sure the class belongs to this school
  const existingClass = await prisma.class.findFirst({
    where: {
      id: classId,
      schoolId,
    },
  });

  if (!existingClass) {
    throw new Error("Class not found");
  }

  // If name is being changed, check for duplicates
  if (
    data.name !== undefined &&
    data.name !== existingClass.name
  ) {
    const duplicateClass = await prisma.class.findFirst({
      where: {
        schoolId,
        name: data.name,
        NOT: {
          id: classId,
        },
      },
    });

    if (duplicateClass) {
      throw new Error("Class already exists");
    }
  }

  const updatedClass = await prisma.class.update({
    where: {
      id: classId,
    },
    data: {
      ...(data.name !== undefined && {
        name: data.name,
      }),

      ...(data.description !== undefined && {
        description: data.description,
      }),
    },
  });

  return updatedClass;
};