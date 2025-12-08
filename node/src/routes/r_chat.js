import { Router } from "express";
import { ChatController } from "../controller/c_chat.js";

const router = Router();

// ambil semua chat room user
router.get("/rooms", ChatController.getChatRooms);

// ambil semua pesan pada room tertentu
router.get("/messages/:storeId/:buyerId", ChatController.getMessages);

// kirim pesan
router.post("/send", ChatController.sendMessage);

export default router;
