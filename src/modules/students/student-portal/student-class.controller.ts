import type { Response } from "express";
import { asyncHandler } from "../../../middleware/asyncHandler";
import type { AuthenticatedRequest } from "../../../utils/extendedRequests";
import {
  getStudentClasses,
  getStudentClassOverview,
  getStudentClassSubjectsWithGrades,
} from "./student-class.service";

// GET /api/student/me/classes
export const getStudentClassesController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const classes = await getStudentClasses(userId);

    return res.status(200).json({
      data: classes,
    });
  }
);

// GET /api/student/me/classes/:classId
export const getStudentClassOverviewController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { classId } = req.params;

    const classOverview = await getStudentClassOverview(userId, classId as string);

    return res.status(200).json({
      data: classOverview,
    });
  }
);



// GET /api/student/me/classes/:classId/subjects
export const getStudentClassSubjectsWithGradesController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { classId } = req.params;

    const subjects = await getStudentClassSubjectsWithGrades(userId, classId as string);

    return res.status(200).json({
      data: subjects,
    });
  }
);