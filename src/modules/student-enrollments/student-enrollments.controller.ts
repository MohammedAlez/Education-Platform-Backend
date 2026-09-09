import type { Response } from "express";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";
import { createEnrollmentSchema, getEnrollmentsQuerySchema, updateEnrollmentSchema } from "./student-enrollments.validation";
import { createEnrollment, getEnrollmentById, getEnrollments, updateEnrollment } from "./student-enrollments.service";
import type { string } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";



export const createEnrollmentController =
  asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const data =
      createEnrollmentSchema.parse(req.body);

      console.log(data)
    const schoolId = req.user!.schoolId;

    const enrollment =
      await createEnrollment(
        schoolId,
        data
      );

    return res.status(201).json({
      message: "Student enrolled successfully",
      data: enrollment,
    });
  });


  export const getEnrollmentsController =
  asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const filters =
      getEnrollmentsQuerySchema.parse(req.query);

    const schoolId = req.user!.schoolId;

    const enrollments = await getEnrollments(
      schoolId,
      filters
    );

    return res.status(200).json({
      data: enrollments,
    });
  });

  export const getEnrollmentByIdController =
  asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const enrollmentId = req.params.id as string;
    const schoolId = req.user!.schoolId;

    const enrollment =
      await getEnrollmentById(
        enrollmentId,
        schoolId
      );

    return res.status(200).json({
      data: enrollment,
    });
  });


  export const updateEnrollmentController =
  asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const data =
      updateEnrollmentSchema.parse(req.body);

    const enrollmentId = req.params.id as string;
    const schoolId = req.user!.schoolId;

    const updatedEnrollment =
      await updateEnrollment(
        enrollmentId,
        schoolId,
        data
      );

    return res.status(200).json({
      message: "Enrollment updated successfully",
      data: updatedEnrollment,
    });
  });