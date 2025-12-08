import { Router } from "express";
import { AuthController } from "../controller/c_auth.js";

const router = Router();

router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", AuthController.getCurrentUser);
router.get("/check", AuthController.checkAuth);

export default router;