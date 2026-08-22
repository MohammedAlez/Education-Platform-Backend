import type { Response } from "express";
import { createTeacherSchema, updateTeacherSchema } from "./teacher.validation";
import { createTeacher, getTeacherById, getTeachers, updateTeacher } from "./teacher.service";
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


export const getTeachersController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const schoolId = req.user!.schoolId;

  const teachers = await getTeachers(schoolId);

  return res.status(200).json({
    data: teachers,
  });
};

export const getTeacherByIdController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const teacherId = req.params.id as string;
  const schoolId = req.user!.schoolId;

  const teacher = await getTeacherById(
    teacherId,
    schoolId
  );

  return res.status(200).json({
    data: teacher,
  });
};

export const updateTeacherController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = updateTeacherSchema.parse(req.body);

  const teacherId = req.params.id as string;
  const schoolId = req.user!.schoolId;

  const teacher = await updateTeacher(
    teacherId,
    schoolId,
    data
  );

  return res.status(200).json({
    message: "Teacher updated successfully",
    data: teacher,
  });
};