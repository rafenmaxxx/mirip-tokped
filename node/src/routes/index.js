import { Router } from "express";
import helloRoute from "./r_hello.js";
import userRoutes from "./r_user.js";
import webpushRoutes from "./r_webpush.js";
import authRoutes from "./r_auth.js";

const router = Router();

router.use("/", helloRoute);
router.use("/user", userRoutes);
router.use("/notif", webpushRoutes);
router.use("/auth", authRoutes);

export default router;
