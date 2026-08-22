import { Router } from "express";
import { createTeacherController } from "./teacher.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createTeacherController
);

export default router;