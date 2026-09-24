import { AppError } from "../../../errors/app-error";
import { prisma } from "../../../lib/prisma";
import { calculateSubjectStats, formatAssessmentType } from "./tools/helper-functions";


// 1. Get all enrolled classes for student dropdown
export const getStudentClasses = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: student.id,
      status: "ACTIVE",
    },
    orderBy: {
      enrolledAt: "asc",
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

  // Map to desired response payload (first enrolled class set as primary)
  return enrollments.map((enrollment, index) => ({
    id: enrollment.class.id,
    name: enrollment.class.name,
    code: `CLA-${enrollment.class.id.slice(-4).toUpperCase()}`,
  }));
};

// 2. Get detailed class metadata, subjects, and teachers
export const getStudentClassOverview = async (
  userId: string,
  classId: string
) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true, schoolId: true },
  });

  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  // Verify active enrollment in requested class
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: student.id,
      classId,
      status: "ACTIVE",
    },
  });

  if (!enrollment) {
    throw new AppError("You are not actively enrolled in this class", 403);
  }

  // Fetch class details along with student count and teaching assignments
  const [classData, studentCount] = await Promise.all([
    prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: student.schoolId,
      },
      include: {
        teachingAssignments: {
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
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.enrollment.count({
      where: {
        classId,
        status: "ACTIVE",
      },
    }),
  ]);

  if (!classData) {
    throw new AppError("Class not found", 404);
  }

  // Transform subjects list
  const subjectsMap = new Map();
  classData.teachingAssignments.forEach((ta) => {
    if (!subjectsMap.has(ta.subject.id)) {
      subjectsMap.set(ta.subject.id, {
        id: ta.subject.id,
        name: ta.subject.name,
        code: `${ta.subject.name.substring(0, 3).toUpperCase()}101`,
        status: "Active Course",
      });
    }
  });

  // Transform teachers list
  const teachers = classData.teachingAssignments.map((ta) => ({
    id: ta.teacher.id,
    firstName: ta.teacher.firstName,
    lastName: ta.teacher.lastName,
    subjectName: ta.subject.name,
    email: ta.teacher.user.email
  }));

  return {
    id: classData.id,
    name: classData.name,
    description:
      classData.description ||
      "Overview of your registered class, subjects, and teaching faculty.",
    studentCount,
    subjects: Array.from(subjectsMap.values()),
    teachers,
  };
};

// Helper function to dynamically map subject names to frontend icon keys
function getSubjectIcon(subjectName: string): string {
  const lower = subjectName.toLowerCase();
  if (lower.includes("math")) return "calculator";
  if (lower.includes("phys") || lower.includes("chem") || lower.includes("sci")) return "atom";
  if (lower.includes("cs") || lower.includes("computer") || lower.includes("code")) return "laptop";
  if (lower.includes("eng") || lower.includes("french")) return "globe";
  if (lower.includes("arab")) return "languages";
  return "book-open";
}



export const getStudentClassSubjectsWithGrades = async (
  userId: string,
  classId: string
) => {
  // 1. Resolve Student profile
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true, schoolId: true },
  });

  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  // 2. Check active enrollment in requested class
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: student.id,
      classId,
      status: "ACTIVE",
    },
  });

  if (!enrollment) {
    throw new AppError("You are not actively enrolled in this class", 403);
  }

  // 3. Query Teaching Assignments for this class along with subject, teacher, and student grades
  const teachingAssignments = await prisma.teachingAssignment.findMany({
    where: {
      classId,
      schoolId: student.schoolId,
    },
    include: {
      subject: true,
      teacher: {
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
      grades: {
        where: {
          studentId: student.id,
        },
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  // 4. Map into desired JSON response payload
  const subjectsData = teachingAssignments.map((ta) => {
    const { averageGrade, status } = calculateSubjectStats(ta.grades);

    const assessments = ta.grades.map((grade, idx) => {
      const { label, weight } = formatAssessmentType(grade.type);
      return {
        id: grade.id,
        title: grade.note || `${label} ${idx + 1}`,
        type: label,
        grade: grade.value,
        maxGrade: grade.maxValue,
        weight,
        date: grade.date ? grade.date.toISOString().split("T")[0] : null,
      };
    });

    return {
      subjectId: ta.subject.id,
      subjectName: ta.subject.name,
      code: `${ta.subject.name.substring(0, 3).toUpperCase()}101`,
      teacher: {
        id: ta.teacher.id,
        firstName: ta.teacher.firstName,
        lastName: ta.teacher.lastName,
        email: ta.teacher.user.email,
      },
      averageGrade,
      maxGrade: 20,
      status,
      assessments,
    };
  });

  return subjectsData;
};