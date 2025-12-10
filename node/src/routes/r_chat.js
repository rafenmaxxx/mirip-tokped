import { Router } from "express";
import { ChatController } from "../controller/c_chat.js";
import { requireChatEnabled } from "../middleware/featureFlags.js";

const router = Router();

router.get("/rooms", requireChatEnabled, ChatController.getChatRooms);
router.get("/messages/:storeId/:buyerId", requireChatEnabled, ChatController.getMessages);
router.post("/send", requireChatEnabled, ChatController.sendMessage);
router.post("/start", requireChatEnabled, ChatController.startNewChat);
router.get("/stores", requireChatEnabled, ChatController.getStoresForChat);

export default router;
