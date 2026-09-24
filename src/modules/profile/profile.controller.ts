import type { Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";
import {
  updateAdminProfile,
  updateSchoolProfile,
  updateStudentProfile,
  updateTeacherProfile,
} from "./profile.service";
import {
  updateAdminProfileSchema,
  updateSchoolProfileSchema,
  updateStudentProfileSchema,
  updateTeacherProfileSchema,
} from "./profile.validation";

// PATCH /api/profiles/admin/:id
export const updateAdminProfileController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = updateAdminProfileSchema.parse(req.body);
    const adminId = req.params.id as string;
    const user = req.user!;

    const updatedProfile = await updateAdminProfile(
      adminId,
      user.schoolId,
      data
    );

    return res.status(200).json({
      message: "Admin profile updated successfully",
      data: updatedProfile,
    });
  }
);

// PATCH /api/profiles/teacher/:id
export const updateTeacherProfileController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = updateTeacherProfileSchema.parse(req.body);
    const teacherId = req.params.id as string;
    const user = req.user!;

    const updatedProfile = await updateTeacherProfile(
      teacherId,
      user.schoolId,
      data
    );

    return res.status(200).json({
      message: "Teacher profile updated successfully",
      data: updatedProfile,
    });
  }
);

// PATCH /api/profiles/student/:id
export const updateStudentProfileController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = updateStudentProfileSchema.parse(req.body);
    const studentId = req.params.id as string;
    const user = req.user!;

    const updatedProfile = await updateStudentProfile(
      studentId,
      user.schoolId,
      data
    );

    return res.status(200).json({
      message: "Student profile updated successfully",
      data: updatedProfile,
    });
  }
);

// PATCH /api/profiles/school
export const updateSchoolProfileController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const data = updateSchoolProfileSchema.parse(req.body);
    const user = req.user!;

    const updatedSchool = await updateSchoolProfile(user.schoolId, data);

    return res.status(200).json({
      message: "School profile updated successfully",
      data: updatedSchool,
    });
  }
);