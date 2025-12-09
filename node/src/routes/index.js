import { Router } from "express";
import helloRoute from "./r_hello.js";
import userRoutes from "./r_user.js";
import auctionRoutes from "./r_auctions.js";
import auctionbidsRoutes from "./r_auctionbids.js";
import webpushRoutes from "./r_webpush.js";
import chatRoutes from "./r_chat.js";

const router = Router();

router.use("/", helloRoute);
router.use("/user", userRoutes);
router.use("/auctions", auctionRoutes);
router.use("/auction-detail", auctionRoutes, userRoutes, auctionbidsRoutes);
router.use("/auctionbids", auctionbidsRoutes);
router.use("/notif", webpushRoutes);
router.use("/chat", chatRoutes);

export default router;  
