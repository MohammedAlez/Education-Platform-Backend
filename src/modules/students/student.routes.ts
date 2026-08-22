import { Router } from "express";
import { createStudentController } from "./student.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createStudentController
);

export default router;