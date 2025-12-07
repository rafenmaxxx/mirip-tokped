import { Router } from "express";
import { WebPushController } from "../controller/c_webpush.js";

const router = Router();

router.post("/subscribe", WebPushController.subscribe);
router.post("/send", WebPushController.send);
router.get("/list", WebPushController.list);

export default router;
