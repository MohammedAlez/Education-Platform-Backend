import { Router } from "express";
import { registerSchoolController } from "./auth.controller";

const router = Router();


router.post("/register-school", registerSchoolController);

export default router;