import { Router } from "express";
import helloRoute from "./r_hello.js";
import userRoutes from "./r_user.js";

const router = Router();

router.use("/", helloRoute);
router.use("/user", userRoutes);

export default router;
