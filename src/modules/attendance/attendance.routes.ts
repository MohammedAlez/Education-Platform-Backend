import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

import {
  createAttendanceController,
} from "./attendance.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  createAttendanceController
);

export default router;