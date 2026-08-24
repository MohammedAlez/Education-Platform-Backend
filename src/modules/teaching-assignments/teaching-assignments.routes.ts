import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { createTeachingAssignmentController, getTeachingAssignmentByIdController, getTeachingAssignmentsController, updateTeachingAssignmentController } from "./teaching-assignments.controller";


const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createTeachingAssignmentController
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getTeachingAssignmentsController
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  getTeachingAssignmentByIdController
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateTeachingAssignmentController
);

export default router;