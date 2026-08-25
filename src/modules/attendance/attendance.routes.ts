import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

import {
  createAttendanceController,
  getAttendanceByIdController,
  getAttendanceController,
  updateAttendanceController,
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

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  getAttendanceByIdController
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  updateAttendanceController
);

export default router;