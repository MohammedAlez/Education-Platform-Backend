import type { Response } from "express";
import {
  createClassSchema,
  updateClassSchema,
} from "./class.validation";
import {
  createClass,
  getClassById,
  getClasses,
  updateClass,
} from "./class.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";

export const createClassController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  console.log('receveid')
  const data = createClassSchema.parse(req.body);

  const schoolId = req.user!.schoolId;

  console.log("received ")
  const newClass = await createClass(
    schoolId,
    data
  );

  return res.status(201).json({
    message: "Class created successfully",
    data: newClass,
  });
};


export const getClassesController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const schoolId = req.user!.schoolId;

  const classes = await getClasses(schoolId);

  return res.status(200).json({
    data: classes,
  });
};


export const getClassByIdController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const classId = req.params.id as string;
  const schoolId = req.user!.schoolId;

  const classItem = await getClassById(
    classId,
    schoolId
  );

  return res.status(200).json({
    data: classItem,
  });
};


export const updateClassController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = updateClassSchema.parse(req.body);

  const classId = req.params.id as string;
  const schoolId = req.user!.schoolId;

  const updatedClass = await updateClass(
    classId,
    schoolId,
    data
  );

  return res.status(200).json({
    message: "Class updated successfully",
    data: updatedClass,
  });
};