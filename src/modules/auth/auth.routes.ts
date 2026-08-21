import { Router } from "express";
import { loginController, registerSchoolController } from "./auth.controller";

const router = Router();


router.post("/register-school", registerSchoolController);
router.post("/login",loginController)

export default router;