import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

import {
  createPaymentController,
  getPaymentByIdController,
  getPaymentsController,
} from "./payment.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createPaymentController
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getPaymentsController
);


router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  getPaymentByIdController
);


export default router;