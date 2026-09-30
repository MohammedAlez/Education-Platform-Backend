import type { Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";
import {
  getStudentOverviewStats,
  getStudentTodayClasses,
  getStudentRecentGrades,
} from "./student-dashboard.service";

// GET /api/student/me/overview/stats
export const getStudentOverviewStatsController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const stats = await getStudentOverviewStats(userId);
    return res.status(200).json({ data: stats });
  }
);

// GET /api/student/me/classes/today
export const getStudentTodayClassesController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const classes = await getStudentTodayClasses(userId);
    return res.status(200).json({ data: classes });
  }
);

// GET /api/student/me/grades/recent
export const getStudentRecentGradesController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

    const grades = await getStudentRecentGrades(userId, limit);
    return res.status(200).json({ data: grades });
  }
);