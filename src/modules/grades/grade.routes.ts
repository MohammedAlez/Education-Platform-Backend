import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

import {
  createGradeController,
  getGradeByIdController,
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


router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  getGradeByIdController
);


export default router;