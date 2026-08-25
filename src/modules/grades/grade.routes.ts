import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

import {
  createGradeController,
} from "./grade.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  createGradeController
);

export default router;