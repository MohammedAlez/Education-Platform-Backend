import type { Response } from "express";



import {
  createPaymentSchema,
} from "./payment.validation";

import {
  createPayment,
} from "./payment.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";

export const createPaymentController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const data =
      createPaymentSchema.parse(req.body);

    const schoolId = req.user!.schoolId;

    const payment =
      await createPayment(
        schoolId,
        data
      );

    return res.status(201).json({
      message: "Payment created successfully",
      data: payment,
    });
  };