import type { Response } from "express";
import { createStudentSchema, updateStudentSchema } from "./student.validation";
import { createStudent, getStudentById, getStudents, updateStudent } from "./student.service";
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



export const getStudentsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const schoolId = req.user!.schoolId;

  const students = await getStudents(schoolId);

  return res.status(200).json({
    data: students,
  });
};

export const getStudentByIdController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const studentId = req.params.id as string;
  const schoolId = req.user!.schoolId ;

  const student = await getStudentById(
    studentId,
    schoolId
  );

  return res.status(200).json({
    data: student,
  });
};

export const updateStudentController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = updateStudentSchema.parse(req.body);

  const studentId = req.params.id as string;
  const schoolId = req.user!.schoolId;

  const student = await updateStudent(
    studentId,
    schoolId,
    data
  );

  return res.status(200).json({
    message: "Student updated successfully",
    data: student,
  });
};