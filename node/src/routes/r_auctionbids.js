import { Router } from "express";
import { AuctionBidsController } from "../controller/c_auctionbids.js";

const router = Router();

router.get("/:auctionId", AuctionBidsController.getByAuctionId);
router.post("/:auctionId", AuctionBidsController.placeBid);

export default router;