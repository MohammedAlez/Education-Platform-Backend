import { Router } from "express";
import { createStudentController, getStudentByIdController, getStudentsController, updateStudentController } from "./student.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createStudentController
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getStudentsController
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  getStudentByIdController
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateStudentController
);

export default router;