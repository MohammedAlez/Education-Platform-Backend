import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  getStudentScheduleController,
  getTeacherScheduleController,
  createScheduleController,
  deleteScheduleController,
} from "./schedule.controller";

const router = Router();

router.use(authenticate);

// Student route
router.get(
  "/student/me/schedule",
  authorize("STUDENT"),
  getStudentScheduleController
);

// Teacher routes (Supports ?day=SUNDAY for today's classes)
router.get(
  "/teacher/me/schedule",
  authorize("TEACHER"),
  getTeacherScheduleController
);

// Admin routes
router.post(
  "/admin/schedules",
  authorize("ADMIN"),
  createScheduleController
);

router.delete(
  "/admin/schedules/:scheduleId",
  authorize("ADMIN"),
  deleteScheduleController
);

export default router;