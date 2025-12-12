import { Router } from "express";
import { AuctionsController } from "../controller/c_auctions.js";
import { requireAuctionEnabled } from "../middleware/featureFlags.js";

const router = Router();

router.get("/", requireAuctionEnabled, AuctionsController.getAll);
router.get(
  "/store/:storeId",
  requireAuctionEnabled,
  AuctionsController.getByStoreId
);
router.get("/:id", requireAuctionEnabled, AuctionsController.getById);
router.post("/", requireAuctionEnabled, AuctionsController.create);
router.post("/:id/stop", requireAuctionEnabled, (req, res) =>
  AuctionsController.stop(req, res)
);
router.post("/:id/cancel", AuctionsController.cancel);

router.delete("/:id", requireAuctionEnabled, (req, res) =>
  AuctionsController.remove(req, res)
);

export default router;
