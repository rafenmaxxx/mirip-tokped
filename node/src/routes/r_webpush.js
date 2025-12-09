// r_webpush.js
import { Router } from "express";
import { WebPushController } from "../controller/c_webpush.js";
import { sessionMiddleware } from "../middleware/Session.js";

const router = Router();

// Apply session middleware ke semua routes
router.use(sessionMiddleware);

// Subscribe - PASTIKAN handler adalah function
router.post("/subscribe", WebPushController.subscribe);

// Send notifications
router.post("/send", WebPushController.send);
router.post("/send/user/:userId", WebPushController.sendToUser);

// Queue management
router.get("/queue/check", WebPushController.checkQueue);
router.get("/queue/user/:userId", WebPushController.getQueued);
router.post("/queue/cleanup", WebPushController.cleanup);

// Get subscriptions
router.get("/list", WebPushController.list);

export default router;
