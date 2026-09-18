import type { Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";
import { getDashboardStats, getRecentPayments, getRecentStudents, getTodayAttendance, getWeeklyAttendanceTrend } from "./dashboard.service";

export const getDashboardStatsController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    const stats = await getDashboardStats(user.schoolId);

    return res.status(200).json({
      data: stats,
    });
  }
);


export const getTodayAttendanceController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    const attendanceData = await getTodayAttendance(user.schoolId);

    return res.status(200).json({
      data: attendanceData,
    });
  }
);

// 3. Weekly Attendance Trend Controller
export const getWeeklyAttendanceTrendController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    const trend = await getWeeklyAttendanceTrend(user.schoolId);

    return res.status(200).json({
      data: trend,
    });
  }
);

// 4. Recent Students Controller
export const getRecentStudentsController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;

    const students = await getRecentStudents(user.schoolId, limit);

    return res.status(200).json({
      data: students,
    });
  }
);

// 5. Recent Payments Controller
export const getRecentPaymentsController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;

    const payments = await getRecentPayments(user.schoolId, limit);

    return res.status(200).json({
      data: payments,
    });
  }
);