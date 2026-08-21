import { Router } from "express";
import { registerSchoolController } from "./auth.controller";

const router = Router();

router.get("/test", (req, res)=>{
    res.send("hello world")
});
router.post("/register-school", registerSchoolController);

export default router;