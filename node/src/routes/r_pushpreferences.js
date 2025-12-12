import { Router } from "express";
import { PushPreferencesController } from "../controller/c_pushpreferences.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/user/:userId", PushPreferencesController.getByUserId);
router.put("/user/:userId", PushPreferencesController.updateByUserId);

export default router;
