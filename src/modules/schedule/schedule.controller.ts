import type { Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";

import {
  getStudentWeeklySchedule,
  getTeacherSchedule,
  createScheduleSlot,
  deleteScheduleSlot,
  getAdminSchedules,
} from "./schedule.service";
import type { DayOfWeek } from "../../../generated/prisma";

// GET /api/student/me/schedule
export const getStudentScheduleController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const schedule = await getStudentWeeklySchedule(userId);
    return res.status(200).json({ data: schedule });
  }
);

// GET /api/teacher/me/schedule
export const getTeacherScheduleController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { day } = req.query;

    const schedule = await getTeacherSchedule(
      userId,
      day ? (day as DayOfWeek) : undefined
    );

    return res.status(200).json({ data: schedule });
  }
);

// POST /api/admin/schedules
export const createScheduleController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const schoolId = req.user!.schoolId;
    const { teachingAssignmentId, dayOfWeek, startTime, endTime, room } = req.body;

    const newSlot = await createScheduleSlot(schoolId, {
      teachingAssignmentId,
      dayOfWeek,
      startTime,
      endTime,
      room,
    });

    return res.status(201).json({
      message: "Schedule slot created successfully",
      data: newSlot,
    });
  }
);

// DELETE /api/admin/schedules/:scheduleId
export const deleteScheduleController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const schoolId = req.user!.schoolId;
    const { scheduleId } = req.params ;

    await deleteScheduleSlot(schoolId, scheduleId as string);

    return res.status(200).json({
      message: "Schedule slot deleted successfully",
    });
  }
);

// GET /api/schedules/admin

export const getAdminSchedulesController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const schoolId = req.user!.schoolId;

    const { classId, teacherId, room, day } = req.query;

    const schedules = await getAdminSchedules(schoolId, {
      ...(typeof classId === "string" && {
        classId,
      }),

      ...(typeof teacherId === "string" && {
        teacherId,
      }),

      ...(typeof room === "string" && {
        room,
      }),

      ...(typeof day === "string" && {
        dayOfWeek: day as DayOfWeek,
      }),
    });

    return res.status(200).json({
      data: schedules,
    });
  }
);