import { prisma } from "../../lib/prisma";
import type { CreateSubjectInput, UpdateSubjectInput } from "./subject.validation";




export const createSubject = async (
  schoolId: string,
  data: CreateSubjectInput
) => {
  const existingSubject = await prisma.subject.findFirst({
    where: {
      schoolId,
      name: data.name,
    },
  });

  if (existingSubject) {
    throw new Error("Subject already exists");
  }

  const subject = await prisma.subject.create({
    data: {
      schoolId,
      name: data.name,
      ...(data.description && {description: data.description})
    },
  });

  return subject;
};


export const getSubjects = async (schoolId: string) => {
  const subjects = await prisma.subject.findMany({
    where: {
      schoolId,
    },
    include: {
      _count: {
        select: {
          teachingAssignments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    description: subject.description,
    teachingAssignmentCount:
      subject._count.teachingAssignments,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
  }));
};

export const getSubjectById = async (
  subjectId: string,
  schoolId: string
) => {
  const subject = await prisma.subject.findFirst({
    where: {
      id: subjectId,
      schoolId,
    },
    include: {
      teachingAssignments: {
        include: {
          teacher: {
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
          class: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!subject) {
    throw new Error("Subject not found");
  }

  return {
    id: subject.id,
    name: subject.name,
    description: subject.description,

    teachingAssignments:
      subject.teachingAssignments.map(
        (assignment) => ({
          id: assignment.id,

          teacher: assignment.teacher,

          class: assignment.class,

          createdAt: assignment.createdAt,
        })
      ),

    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
  };
};


export const updateSubject = async (
  subjectId: string,
  schoolId: string,
  data: UpdateSubjectInput
) => {
  const existingSubject = await prisma.subject.findFirst({
    where: {
      id: subjectId,
      schoolId,
    },
  });

  if (!existingSubject) {
    throw new Error("Subject not found");
  }

  // Check for duplicate name within the same school
  if (
    data.name !== undefined &&
    data.name !== existingSubject.name
  ) {
    const duplicateSubject = await prisma.subject.findFirst({
      where: {
        schoolId,
        name: data.name,
        NOT: {
          id: subjectId,
        },
      },
    });

    if (duplicateSubject) {
      throw new Error("Subject already exists");
    }
  }

  const updatedSubject = await prisma.subject.update({
    where: {
      id: subjectId,
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

  return updatedSubject;
};