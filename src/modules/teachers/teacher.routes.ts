import { Router } from "express";
import { createTeacherController, getTeacherByIdController, getTeacherClassesController, getTeachersController, getTeacherStudentsController, updateTeacherController } from "./teacher.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createTeacherController
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getTeachersController
);


// ============== related to teacher dashboard screens ============== 
router.get("/students",
   authenticate,
   authorize("TEACHER"),
   getTeacherStudentsController
);

router.get("/classes",
   authenticate,
   authorize("TEACHER"),
   getTeacherClassesController
);
// ==================================================================


router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  getTeacherByIdController
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateTeacherController
);




export default router;