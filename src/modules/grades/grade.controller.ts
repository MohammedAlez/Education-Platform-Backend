import type { Response } from "express";



import {
  createGradeSchema,
  getGradesQuerySchema,
  updateGradeSchema,
} from "./grade.validation";

import {
  createGrade,
  getGradeById,
  getGrades,
  updateGrade,
} from "./grade.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";
import { asyncHandler } from "../../middleware/asyncHandler";

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