import type { Response } from "express";



import {
  createAttendanceSchema,
} from "./attendance.validation";

import {
  createAttendance,
} from "./attendance.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";

export const createAttendanceController =
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
  };