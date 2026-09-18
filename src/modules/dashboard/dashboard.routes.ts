import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { getDashboardStatsController, getRecentPaymentsController, getRecentStudentsController, getTodayAttendanceController, getWeeklyAttendanceTrendController } from "./dashboard.controller";

const router = Router();

// Protect dashboard stats so only ADMIN accounts can access overall school analytics
router.get(
  "/stats",
  authenticate,
  authorize("ADMIN"),
  getDashboardStatsController
);

router.get(
    "/attendance/today",
    authenticate,
    authorize("ADMIN"),
    getTodayAttendanceController
);

router.get(
    "/attendance/weekly-trend",
    authenticate,
    authorize("ADMIN"),
    getWeeklyAttendanceTrendController
);

router.get(
    "/students/recent",
    authenticate,
    authorize("ADMIN"),
    getRecentStudentsController
);

router.get(
    "/payments/recent",
    authenticate,
    authorize("ADMIN"),
    getRecentPaymentsController
);

export default router;