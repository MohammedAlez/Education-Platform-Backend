import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { createEnrollmentController, getEnrollmentByIdController, getEnrollmentsController, updateEnrollmentController } from "./student-enrollments.controller";


const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createEnrollmentController
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getEnrollmentsController
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  getEnrollmentByIdController
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateEnrollmentController
);

export default router;