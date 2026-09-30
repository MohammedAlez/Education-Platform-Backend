import type { Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";
import {
  getTeacherOverviewStats,
  getPendingAttendance,
  recordAttendanceBulk,
  getRecentGrades,
} from "./teacher-dashboard.service";

// GET /api/teachers/overview/stats
export const getTeacherOverviewStatsController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const stats = await getTeacherOverviewStats(userId);
    return res.status(200).json({ data: stats });
  }
);

// GET /api/attendance/pending
export const getPendingAttendanceController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { date } = req.query;

    const pending = await getPendingAttendance(
      userId,
      date as string | undefined
    );
    return res.status(200).json({ data: pending });
  }
);

// POST /api/attendance
export const recordAttendanceController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { teachingAssignmentId, date, records } = req.body;

    const result = await recordAttendanceBulk(userId, {
      teachingAssignmentId,
      date,
      records,
    });

    return res.status(201).json({
      message: "Attendance recorded successfully",
      data: result,
    });
  }
);

// GET /api/grades/recent
export const getRecentGradesController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

    const grades = await getRecentGrades(userId, limit);
    return res.status(200).json({ data: grades });
  }
);