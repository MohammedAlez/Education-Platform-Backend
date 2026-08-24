import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

import {
  createSubjectController,
  getSubjectByIdController,
  getSubjectsController,
  updateSubjectController,
} from "./subject.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createSubjectController
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getSubjectsController
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  getSubjectByIdController
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateSubjectController
);

export default router;