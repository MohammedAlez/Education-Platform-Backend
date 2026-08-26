import type { Response } from "express";



import {
  createPaymentSchema,
  getPaymentsQuerySchema,
  updatePaymentSchema,
} from "./payment.validation";

import {
  createPayment,
  getPaymentById,
  getPayments,
  updatePayment,
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


  export const getPaymentsController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const filters =
      getPaymentsQuerySchema.parse(
        req.query
      );

    const schoolId =
      req.user!.schoolId;

    const payments =
      await getPayments(
        schoolId,
        filters
      );

    return res.status(200).json({
      data: payments,
    });
  };

  export const getPaymentByIdController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const paymentId = req.params.id as string;

    const schoolId =
      req.user!.schoolId;

    const payment =
      await getPaymentById(
        paymentId,
        schoolId
      );

    return res.status(200).json({
      data: payment,
    });
  };


  export const updatePaymentController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const data =
      updatePaymentSchema.parse(
        req.body
      );

    const paymentId = req.params.id as string;

    const schoolId =
      req.user!.schoolId;

    const updatedPayment =
      await updatePayment(
        paymentId,
        schoolId,
        data
      );

    return res.status(200).json({
      message: "Payment updated successfully",
      data: updatedPayment,
    });
  };