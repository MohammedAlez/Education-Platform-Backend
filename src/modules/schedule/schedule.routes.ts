import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  getStudentScheduleController,
  getTeacherScheduleController,
  createScheduleController,
  deleteScheduleController,
  getAdminSchedulesController,
} from "./schedule.controller";

const router = Router();

router.use(authenticate);

// Student route
router.get(
  "/student/me",
  authorize("STUDENT"),
  getStudentScheduleController
);

// Teacher routes (Supports ?day=SUNDAY for today's classes)
router.get(
  "/teacher/me",
  authorize("TEACHER"),
  getTeacherScheduleController
);

// Admin routes
router.post(
  "/admin",
  authorize("ADMIN"),
  createScheduleController
);


// Admin: Fetch schedules with filters (?classId=...&teacherId=...&room=...&day=...)
router.get(
  "/admin",
  authorize("ADMIN"),
  getAdminSchedulesController
);


router.delete(
  "/admin/:scheduleId",
  authorize("ADMIN"),
  deleteScheduleController
);

export default router;