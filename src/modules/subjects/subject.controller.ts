import type { Response } from "express";


import { createSubjectSchema, updateSubjectSchema } from "./subject.validation";
import { createSubject, getSubjectById, getSubjects, updateSubject } from "./subject.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";

export const createSubjectController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = createSubjectSchema.parse(req.body);

  const schoolId = req.user!.schoolId;

  const subject = await createSubject(
    schoolId,
    data
  );

  return res.status(201).json({
    message: "Subject created successfully",
    data: subject,
  });
};

export const getSubjectsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const schoolId = req.user!.schoolId;

  const subjects = await getSubjects(schoolId);

  return res.status(200).json({
    data: subjects,
  });
};

export const getSubjectByIdController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const subjectId = req.params.id as string;
  const schoolId = req.user!.schoolId;

  const subject = await getSubjectById(
    subjectId,
    schoolId
  );

  return res.status(200).json({
    data: subject,
  });
};


export const updateSubjectController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const data = updateSubjectSchema.parse(req.body);

  const subjectId = req.params.id as string;
  const schoolId = req.user!.schoolId;

  const updatedSubject = await updateSubject(
    subjectId,
    schoolId,
    data
  );

  return res.status(200).json({
    message: "Subject updated successfully",
    data: updatedSubject,
  });
};