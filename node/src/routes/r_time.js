import { Router } from "express";
import { TimeController } from "../controller/c_time.js";

const router = Router();

router.get("/", TimeController.getTime);

export default router;
