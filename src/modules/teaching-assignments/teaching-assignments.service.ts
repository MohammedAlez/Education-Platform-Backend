import { prisma } from "../../lib/prisma";
import type { CreateTeachingAssignmentInput, UpdateTeachingAssignmentInput } from "./teaching-assignments.validation";



export const createTeachingAssignment = async (
  schoolId: string,
  data: CreateTeachingAssignmentInput
) => {
  // Make sure teacher belongs to this school
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: data.teacherId,
      schoolId,
    },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  // Make sure subject belongs to this school
  const subject = await prisma.subject.findFirst({
    where: {
      id: data.subjectId,
      schoolId,
    },
  });

  if (!subject) {
    throw new Error("Subject not found");
  }

  // Make sure class belongs to this school
  const classItem = await prisma.class.findFirst({
    where: {
      id: data.classId,
      schoolId,
    },
  });

  if (!classItem) {
    throw new Error("Class not found");
  }

  // Prevent duplicate assignment
  const existingAssignment =
    await prisma.teachingAssignment.findUnique({
      where: {
        teacherId_subjectId_classId: {
          teacherId: data.teacherId,
          subjectId: data.subjectId,
          classId: data.classId,
        },
      },
    });

  if (existingAssignment) {
    throw new Error(
      "This teaching assignment already exists"
    );
  }

  const assignment =
    await prisma.teachingAssignment.create({
      data: {
        schoolId,
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        classId: data.classId,
      },
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
    });

  return assignment;
};


export const getTeachingAssignments = async (
  schoolId: string
) => {
  const assignments =
    await prisma.teachingAssignment.findMany({
      where: {
        schoolId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
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
    });

  return assignments;
};

export const getTeachingAssignmentById = async (
  assignmentId: string,
  schoolId: string
) => {
  const assignment =
    await prisma.teachingAssignment.findFirst({
      where: {
        id: assignmentId,
        schoolId,
      },
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
    });

  if (!assignment) {
    throw new Error("Teaching assignment not found");
  }

  return assignment;
};


export const updateTeachingAssignment = async (
  assignmentId: string,
  schoolId: string,
  data: UpdateTeachingAssignmentInput
) => {
  const existingAssignment =
    await prisma.teachingAssignment.findFirst({
      where: {
        id: assignmentId,
        schoolId,
      },
    });

  if (!existingAssignment) {
    throw new Error("Teaching assignment not found");
  }

  const teacherId =
    data.teacherId ?? existingAssignment.teacherId;

  const subjectId =
    data.subjectId ?? existingAssignment.subjectId;

  const classId =
    data.classId ?? existingAssignment.classId;

  // Validate teacher belongs to this school
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      schoolId,
    },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  // Validate subject belongs to this school
  const subject = await prisma.subject.findFirst({
    where: {
      id: subjectId,
      schoolId,
    },
  });

  if (!subject) {
    throw new Error("Subject not found");
  }

  // Validate class belongs to this school
  const classItem = await prisma.class.findFirst({
    where: {
      id: classId,
      schoolId,
    },
  });

  if (!classItem) {
    throw new Error("Class not found");
  }

  // Check duplicate combination
  const duplicateAssignment =
    await prisma.teachingAssignment.findFirst({
      where: {
        teacherId,
        subjectId,
        classId,
        NOT: {
          id: assignmentId,
        },
      },
    });

  if (duplicateAssignment) {
    throw new Error(
      "This teaching assignment already exists"
    );
  }

  const updatedAssignment =
    await prisma.teachingAssignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        teacherId,
        subjectId,
        classId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
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
        class: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

  return updatedAssignment;
};