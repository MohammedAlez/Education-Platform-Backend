import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  getStudentOverviewStatsController,
  getStudentTodayClassesController,
  getStudentRecentGradesController,
} from "./student-dashboard.controller";

const router = Router();

router.use(authenticate);
router.use(authorize("STUDENT"));

// Overview metrics & attendance summary
router.get("/overview/stats", getStudentOverviewStatsController);

// Today's scheduled classes
router.get("/classes/today", getStudentTodayClassesController);

// Recently added grades
router.get("/grades/recent", getStudentRecentGradesController);

export default router;