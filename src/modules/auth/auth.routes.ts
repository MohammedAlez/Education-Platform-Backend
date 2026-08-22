import { Router } from "express";
import { loginController, meController, refreshTokenController, registerSchoolController } from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";

const router = Router();


router.post("/register-school", registerSchoolController);
router.post("/login",loginController)
router.post("/refresh",refreshTokenController)
router.get("/me", authenticate, meController)


export default router;