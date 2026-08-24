import type { Response } from "express";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";
import { createTeachingAssignmentSchema, updateTeachingAssignmentSchema } from "./teaching-assignments.validation";
import { createTeachingAssignment, getTeachingAssignmentById, getTeachingAssignments, updateTeachingAssignment } from "./teaching-assignments.service";




export const createTeachingAssignmentController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const data =
      createTeachingAssignmentSchema.parse(
        req.body
      );

    const schoolId = req.user!.schoolId;

    const assignment =
      await createTeachingAssignment(
        schoolId,
        data
      );

    return res.status(201).json({
      message:
        "Teaching assignment created successfully",
      data: assignment,
    });
  };

  export const getTeachingAssignmentsController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const schoolId = req.user!.schoolId;

    const assignments =
      await getTeachingAssignments(schoolId);

    return res.status(200).json({
      data: assignments,
    });
  };

  export const getTeachingAssignmentByIdController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const assignmentId = req.params.id as string;
    const schoolId = req.user!.schoolId;

    const assignment =
      await getTeachingAssignmentById(
        assignmentId,
        schoolId
      );

    return res.status(200).json({
      data: assignment,
    });
  };



  export const updateTeachingAssignmentController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const data =
      updateTeachingAssignmentSchema.parse(
        req.body
      );

    const assignmentId = req.params.id as string;
    const schoolId = req.user!.schoolId ;

    const updatedAssignment =
      await updateTeachingAssignment(
        assignmentId,
        schoolId,
        data
      );

    return res.status(200).json({
      message:
        "Teaching assignment updated successfully",
      data: updatedAssignment,
    });
  };