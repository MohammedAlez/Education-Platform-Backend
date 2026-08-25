import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

import {
  createAttendanceController,
  getAttendanceController,
} from "./attendance.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  createAttendanceController
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  getAttendanceController
);

export default router;