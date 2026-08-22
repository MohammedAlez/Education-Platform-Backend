import type { Request, Response } from "express";
import { loginSchema, refreshTokenSchema, registerSchoolSchema } from "./auth.validation";
import { getCurrentUser, login, refreshAccessToken, registerSchool } from "./auth.service";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";

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

export const loginController = async (
  req: Request,
  res: Response
) => {
  const data = loginSchema.parse(req.body);

  const result = await login(data);

  return res.status(200).json({
    message: "Login successful",
    data: result,
  });
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