import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

import {
  bulkUpdateGradeController,
  createGradeController,
  getGradeByIdController,
  getGradesController,
  getGradeStatsController,
  getStudentAveragesController,
  updateGradeController,
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

// New routes for stats and student averages
router.get("/stats", 
  authenticate,
  authorize("ADMIN", "TEACHER"),
  getGradeStatsController
);


router.get("/student-averages", 
  authenticate,
  authorize("ADMIN", "TEACHER"),
  getStudentAveragesController
);
//############ end  of new routes ###############


// Bulk Update Endpoint for Teacher Portal

router.patch(
  "/bulk-update",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  bulkUpdateGradeController
);


router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  getGradeByIdController
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  updateGradeController
);





export default router;