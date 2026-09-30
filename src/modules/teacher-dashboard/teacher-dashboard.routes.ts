import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  getTeacherOverviewStatsController,
  getPendingAttendanceController,
  recordAttendanceController,
  getRecentGradesController,
} from "./teacher-dashboard.controller";

const router = Router();

router.use(authenticate);
router.use(authorize("TEACHER"));

// Metric stats card
router.get("/overview/stats", getTeacherOverviewStatsController);

// Pending attendance banner & Submission
router.get("/attendance/pending", getPendingAttendanceController);
router.post("/attendance", recordAttendanceController);

// Recent grades table
router.get("/grades/recent", getRecentGradesController);

export default router;