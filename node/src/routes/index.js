import { Router } from "express";
import helloRoute from "./r_hello.js";
import userRoutes from "./r_user.js";
import auctionRoutes from "./r_auctions.js";
import auctionbidsRoutes from "./r_auctionbids.js";
import webpushRoutes from "./r_webpush.js";
import chatRoutes from "./r_chat.js";
import storeRoutes from "./r_stores.js";
import productRoutes from "./r_products.js";
import authRoutes from "./r_auth.js";
import flagsRoutes from "./r_flags.js";

const router = Router();

router.use("/", helloRoute);
router.use("/user", userRoutes);
router.use("/auctions", auctionRoutes);
router.use("/auction-detail", auctionRoutes, userRoutes, auctionbidsRoutes);
router.use("/auctionbids", auctionbidsRoutes);
router.use("/auction-manage", auctionRoutes, userRoutes, auctionbidsRoutes);
router.use("/notif", webpushRoutes);
router.use("/chat", chatRoutes);
router.use("/store", storeRoutes);
router.use("/products", productRoutes);
router.use("/auth", authRoutes);
router.use("/flags", flagsRoutes);

export default router;  
