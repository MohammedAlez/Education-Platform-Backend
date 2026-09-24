import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate";
import { authorize } from "../../../middleware/authorize";
import {
  getStudentClassesController,
  getStudentClassOverviewController,
} from "./student-class.controller";

const router = Router();

router.use(authenticate);
router.use(authorize("STUDENT"));

// List enrolled classes for selector dropdown
router.get("/classes", getStudentClassesController);

// Get detailed class overview by classId
router.get("/classes/:classId", getStudentClassOverviewController);

export default router;