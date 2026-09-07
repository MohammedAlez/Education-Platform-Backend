import type { Request, Response } from "express";
import { changePasswordSchema, loginSchema, logoutSchema, refreshTokenSchema, registerSchoolSchema } from "./auth.validation";
import { changePassword, getCurrentUser, login, logout, refreshAccessToken, registerSchool } from "./auth.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";
import { AppError } from "../../errors/app-error";
import { ZodError } from "zod";

export const registerSchoolController = async (
  req: Request,
  res: Response
) => {
    
  const data = registerSchoolSchema.parse(req.body);

  const result = await registerSchool(data);

  return res.status(201).json({
    message: "School registered successfully",
    data: result,
  });
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await login(data);

    return res.status(200).json({
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    // 1. Handle Zod Schema Validation Errors
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.flatten().fieldErrors,
      });
    }

    // 2. Handle Known Operational Errors (e.g., AppError)
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    // 3. Log Unexpected Internal Errors (e.g., DB down, network fault)
    console.error('Unhandled Login Error:', error);

    return res.status(500).json({
      message: 'Internal server error. Please try again later.',
    });
  }
};

export const refreshTokenController = async (
  req: Request,
  res: Response
) => {
  const data = refreshTokenSchema.parse(req.body);

  const result = await refreshAccessToken(data);

  return res.status(200).json({
    message: "Token refreshed successfully",
    data: result,
  });
};

export const meController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const user = await getCurrentUser(req.user!.userId);

  return res.status(200).json({
    data: user,
  });
};

export const logoutController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { refreshToken } = logoutSchema.parse(req.body);

  const userId = req.user!.userId;

  await logout(userId, refreshToken);

  return res.status(204).send();
};

export const changePasswordController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { currentPassword, newPassword } =
    changePasswordSchema.parse(req.body);

  const userId = req.user!.userId;

  await changePassword(
    userId,
    currentPassword,
    newPassword
  );

  return res.status(200).json({
    message: "Password changed successfully",
  });
};