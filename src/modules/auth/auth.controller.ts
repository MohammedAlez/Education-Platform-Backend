import type { Request, Response } from "express";
import { loginSchema, registerSchoolSchema } from "./auth.validation";
import { login, registerSchool } from "./auth.service";

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