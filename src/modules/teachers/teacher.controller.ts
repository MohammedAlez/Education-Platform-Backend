import type { Response } from "express";
import { createTeacherSchema } from "./teacher.validation";
import { createTeacher } from "./teacher.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";

export const createTeacherController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = createTeacherSchema.parse(req.body);

  const schoolId = req.user!.schoolId;

  const teacher = await createTeacher(
    data,
    schoolId
  );

  return res.status(201).json({
    message: "Teacher created successfully",
    data: teacher,
  });
};