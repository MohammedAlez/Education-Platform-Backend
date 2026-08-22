import { Router, type Request, type Response } from "express";
import { loginController, meController, refreshTokenController, registerSchoolController } from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";
import type { AuthenticatedRequest } from "../../utils/extendedRequests";
import { authorize } from "../../middleware/authorize";

const router = Router();


router.post("/register-school", registerSchoolController);
router.post("/login",loginController)
router.post("/refresh",refreshTokenController)
router.get("/me", authenticate, meController)
router.get(
  "/admin-test",
  authenticate,
  authorize("ADMIN"),
  (req: Request, res: Response) => {
    return res.json({
      message: "You are an admin!",
    });
  }
);

export default router;