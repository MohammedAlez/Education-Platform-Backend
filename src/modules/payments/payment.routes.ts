import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

import {
  createPaymentController,
} from "./payment.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createPaymentController
);

export default router;