import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import {
  updateAdminProfileController,
  updateSchoolProfileController,
  updateStudentProfileController,
  updateTeacherProfileController,
} from "./profile.controller";

const router = Router();

router.use(authenticate);

// Admin Profile Update (ADMIN only)
router.patch(
  "/admin/:id",
  authorize("ADMIN"),
  updateAdminProfileController
);

// Teacher Profile Update (ADMIN or TEACHER updating own profile)
router.patch(
  "/teacher/:id",
  authorize("ADMIN", "TEACHER"),
  updateTeacherProfileController
);

// Student Profile Update (ADMIN or STUDENT updating own profile)
router.patch(
  "/student/:id",
  authorize("ADMIN", "STUDENT"),
  updateStudentProfileController
);

// School Profile Update (ADMIN only)
router.patch(
  "/school",
  authorize("ADMIN"),
  updateSchoolProfileController
);

export default router;