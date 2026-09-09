import type { Response } from "express";


import {
  createAttendanceSchema,
  getAttendanceQuerySchema,
  updateAttendanceSchema,
} from "./attendance.validation";

import {
  createAttendance,
  getAttendance,
  getAttendanceById,
  updateAttendance,
} from "./attendance.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";
import { asyncHandler } from "../../middleware/asyncHandler";

export const createAttendanceController = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const data =
      createAttendanceSchema.parse(req.body);

    const user = req.user!;

    const attendance =
      await createAttendance(
        user.schoolId,
        user.userId,
        user.role as "ADMIN" | "TEACHER",
        data
      );

    return res.status(201).json({
      message: "Attendance created successfully",
      data: attendance,
    });
});

export const getAttendanceController = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const filters =
      getAttendanceQuerySchema.parse(
        req.query
      );

    const schoolId = req.user!.schoolId;

    const attendance = await getAttendance(
      schoolId,
      filters
    );

    return res.status(200).json({
      data: attendance,
    });
});

export const getAttendanceByIdController = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const attendanceId = req.params.id as string;

    const user = req.user!;

    const attendance =
      await getAttendanceById(
        attendanceId,
        user.schoolId,
        user.userId,
        user.role as "ADMIN" | "TEACHER"
      );

    return res.status(200).json({
      data: attendance,
    });
});

export const updateAttendanceController = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const data =
      updateAttendanceSchema.parse(req.body);

    const attendanceId = req.params.id as string;

    const user = req.user!;

    const updatedAttendance =
      await updateAttendance(
        attendanceId,
        user.schoolId,
        user.userId,
        user.role as "ADMIN" | "TEACHER",
        data
      );

    return res.status(200).json({
      message: "Attendance updated successfully",
      data: updatedAttendance,
    });
});