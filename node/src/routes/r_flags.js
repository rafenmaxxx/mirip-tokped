import { Router } from "express";
import { FlagsController } from "../controller/c_flags.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/global", FlagsController.getGlobalFlags);
router.get("/user/:userId", FlagsController.getUserFlags);

router.get("/check", FlagsController.checkFeature);

router.get("/restrictions/global", FlagsController.getGlobalRestrictions);
router.get("/restrictions/:userId", FlagsController.getUserRestrictions);

// Admin-only routes for updating flags
router.put("/global", requireAdmin, FlagsController.updateGlobalFlag);
router.put("/user/:userId", requireAdmin, FlagsController.updateUserFlag);

export default router;
