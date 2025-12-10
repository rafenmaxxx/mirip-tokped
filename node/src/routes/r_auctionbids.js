import { Router } from "express";
import { AuctionBidsController } from "../controller/c_auctionbids.js";
import { requireAuctionEnabled } from "../middleware/featureFlags.js";

const router = Router();

router.get("/:auctionId", AuctionBidsController.getByAuctionId);
router.post("/:auctionId", requireAuctionEnabled, AuctionBidsController.placeBid);

export default router;