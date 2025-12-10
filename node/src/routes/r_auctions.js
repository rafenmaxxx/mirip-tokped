import { Router } from "express";
import { AuctionsController } from "../controller/c_auctions.js";
import { requireAuctionEnabled } from "../middleware/featureFlags.js";

const router = Router();

router.get("/", AuctionsController.getAll);
router.get("/:id", AuctionsController.getById);
router.post("/", requireAuctionEnabled, AuctionsController.create);
router.post("/:id/stop", requireAuctionEnabled, AuctionsController.stop);
router.delete("/:id", requireAuctionEnabled, AuctionsController.remove);

export default router;