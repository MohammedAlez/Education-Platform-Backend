import type { Response } from "express";
import { createTeacherSchema, getTeacherStudentsQuerySchema, updateTeacherSchema } from "./teacher.validation";
import { createTeacher, getTeacherById, getTeachers, updateTeacher } from "./teacher.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";
import { asyncHandler } from "../../middleware/asyncHandler";
import { getTeacherStudents } from "./services/teacher-students.service";
import { getTeacherClasses } from "./services/teacher-classes.service";

export const createTeacherController = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = createTeacherSchema.parse(req.body);

  const schoolId = req.user!.schoolId;

  const teacher = await createTeacher(
    data,
    schoolId
  );

  return res.status(201).json({
    message: "Teacher created successfully",
    data: teacher,
  });
});


export const getTeachersController = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const schoolId = req.user!.schoolId;

  const teachers = await getTeachers(schoolId);

  return res.status(200).json({
    data: teachers,
  });
});

export const getTeacherByIdController = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const teacherId = req.params.id as string;
  const schoolId = req.user!.schoolId;

  const teacher = await getTeacherById(
    teacherId,
    schoolId
  );

  return res.status(200).json({
    data: teacher,
  });
});

export const updateTeacherController = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = updateTeacherSchema.parse(req.body);

  const teacherId = req.params.id as string;
  const schoolId = req.user!.schoolId;

  const teacher = await updateTeacher(
    teacherId,
    schoolId,
    data
  );

  return res.status(200).json({
    message: "Teacher updated successfully",
    data: teacher,
  });
});


// ================ teacher students controller ====================
export const getTeacherStudentsController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const filters = getTeacherStudentsQuerySchema.parse(req.query);
    const user = req.user!;

    const students = await getTeacherStudents(
      user.schoolId,
      user.userId,
      filters
    );

    return res.status(200).json({
      data: students,
    });
  }
);

// ========================================


// ===================== teacher classes controller ========================

export const getTeacherClassesController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    const classes = await getTeacherClasses(user.schoolId, user.userId);

    return res.status(200).json({
      data: classes,
    });
  }
);

// ===========================================================================