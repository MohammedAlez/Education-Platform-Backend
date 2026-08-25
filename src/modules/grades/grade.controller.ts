import type { Response } from "express";



import {
  createGradeSchema,
  getGradesQuerySchema,
} from "./grade.validation";

import {
  createGrade,
  getGrades,
} from "./grade.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";

export const createGradeController =
  async (
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
  };


  export const getGradesController =
  async (
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
  };