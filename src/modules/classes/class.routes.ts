import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { createClassController, getClassByIdController, getClassesController, updateClassController } from "./class.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createClassController
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getClassesController
);


router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  getClassByIdController
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateClassController
);

export default router;