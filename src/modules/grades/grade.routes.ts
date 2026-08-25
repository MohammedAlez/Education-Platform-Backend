import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

import {
  createGradeController,
  getGradesController,
} from "./grade.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  createGradeController
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  getGradesController
);

export default router;