import type { Response } from "express";
import { createStudentSchema } from "./student.validation";
import { createStudent } from "./student.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";

export const createStudentController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = createStudentSchema.parse(req.body);

  const schoolId = req.user!.schoolId;

  const student = await createStudent(
    data,
    schoolId
  );

  return res.status(201).json({
    message: "Student created successfully",
    data: student,
  });
};