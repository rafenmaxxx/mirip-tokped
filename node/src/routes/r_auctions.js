import { Router } from "express";
import { AuctionsController } from "../controller/c_auctions.js";
import { requireAuctionEnabled } from "../middleware/featureFlags.js";

const router = Router();

router.get("/", AuctionsController.getAll);
router.get("/store/:storeId", AuctionsController.getByStoreId);
router.get("/:id", AuctionsController.getById);
router.post("/", requireAuctionEnabled, AuctionsController.create);
router.post("/:id/stop", requireAuctionEnabled, AuctionsController.stop);
router.delete("/:id", requireAuctionEnabled, AuctionsController.remove);
router.post("/:id/cancel", AuctionsController.cancel);

export default router;