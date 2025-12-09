import { Router } from "express";
import { ChatController } from "../controller/c_chat.js";

const router = Router();

router.get("/rooms", ChatController.getChatRooms);
router.get("/messages/:storeId/:buyerId", ChatController.getMessages);
router.post("/send", ChatController.sendMessage);
router.post("/start", ChatController.startNewChat); // Route baru
router.get("/stores", ChatController.getStoresForChat); // Route baru

export default router;
