import { Router } from "express";
import { loginController, refreshTokenController, registerSchoolController } from "./auth.controller";

const router = Router();


router.post("/register-school", registerSchoolController);
router.post("/login",loginController)
router.post("/refresh",refreshTokenController)

export default router;