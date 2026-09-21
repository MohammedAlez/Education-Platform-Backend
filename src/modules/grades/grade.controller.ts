import type { Response } from "express";



import {
  bulkUpdateGradeSchema,
  createGradeSchema,
  getGradesQuerySchema,
  updateGradeSchema,
} from "./grade.validation";

import {
  createGrade,
  getGradeById,
  getGrades,
  getGradeStats,
  getStudentAverages,
  updateGrade,
} from "./grade.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";
import { asyncHandler } from "../../middleware/asyncHandler";
import { bulkUpdateGrade } from "./services/teacher-bulk-grades.service";

export const createGradeController =
  asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const data =
      createGradeSchema.parse(req.body);

    const user = req.user!;

    const grade = await createGrade(
      user.schoolId,
      user.userId,
      user.role as "ADMIN" | "TEACHER",
      data
    );

    return res.status(201).json({
      message: "Grade created successfully",
      data: grade,
    });
  });


export const getGradesController =
asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const filters =
    getGradesQuerySchema.parse(
      req.query
    );

  const user = req.user!;

  const grades = await getGrades(
    user.schoolId,
    user.userId,
    user.role as "ADMIN" | "TEACHER",
    filters
  );

  return res.status(200).json({
    data: grades,
  });
});

export const getGradeByIdController =
asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const gradeId = req.params.id as string;

  const user = req.user!;

  const grade = await getGradeById(
    gradeId,
    user.schoolId,
    user.userId,
    user.role as "ADMIN" | "TEACHER"
  );

  return res.status(200).json({
    data: grade,
  });
});


export const updateGradeController =
asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data =
    updateGradeSchema.parse(req.body);

  const gradeId = req.params.id as string;

  const user = req.user!;

  const updatedGrade =
    await updateGrade(
      gradeId,
      user.schoolId,
      user.userId,
      user.role as "ADMIN" | "TEACHER",
      data
    );

  return res.status(200).json({
    message: "Grade updated successfully",
    data: updatedGrade,
  });
});


// new ones 
export const getGradeStatsController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {

    console.log("Received request for grade stats with query:", req.query);
    const filters = getGradesQuerySchema.parse(req.query);
    const user = req.user!;

    const stats = await getGradeStats(
      user.schoolId,
      user.userId,
      user.role as "ADMIN" | "TEACHER",
      filters
    );

    return res.status(200).json({ data: stats });
  }
);

export const getStudentAveragesController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const filters = getGradesQuerySchema.parse(req.query);
    const user = req.user!;

    const studentAverages = await getStudentAverages(
      user.schoolId,
      user.userId,
      user.role as "ADMIN" | "TEACHER",
      filters
    );

    return res.status(200).json({ data: studentAverages });
  }
);


export const bulkUpdateGradeController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = bulkUpdateGradeSchema.parse(req.body);
    const user = req.user!;

    const updatedGrades = await bulkUpdateGrade(
      user.schoolId,
      user.userId,
      user.role as "ADMIN" | "TEACHER",
      data
    );

    return res.status(200).json({
      message: `${updatedGrades.length} grade record(s) updated successfully`,
      data: updatedGrades,
    });
  }
);