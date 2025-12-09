import express from "express";
import { AuthController } from "../controller/c_auth.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/refresh", AuthController.refreshToken);
router.get("/me", requireAdmin, AuthController.getCurrentUser);
router.get("/check", requireAdmin, AuthController.checkAuth);

export default router;