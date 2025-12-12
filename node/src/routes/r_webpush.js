import { Router } from "express";
import { WebPushController } from "../controller/c_webpush.js";
import { sessionMiddleware } from "../middleware/session.js";

const router = Router();

router.use(sessionMiddleware);

router.post("/subscribe", WebPushController.subscribe);

router.post("/send", WebPushController.send);
router.post("/send/user/:userId", WebPushController.sendToUser);

router.get("/queue/check", WebPushController.checkQueue);
router.get("/queue/user/:userId", WebPushController.getQueued);
router.post("/queue/cleanup", WebPushController.cleanup);

router.get("/list", WebPushController.list);

export default router;
