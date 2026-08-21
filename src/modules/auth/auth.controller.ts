import type { Request, Response } from "express";
import { registerSchoolSchema } from "./auth.validation";
import { registerSchool } from "./auth.service";

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