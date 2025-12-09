import { Router } from "express";
import { AuctionsController } from "../controller/c_auctions.js";

const router = Router();

router.get("/", AuctionsController.getAll);
router.get("/:id", AuctionsController.getById);
router.post("/", AuctionsController.create);
router.post("/:id/stop", AuctionsController.stop);
router.delete("/:id", AuctionsController.remove);
router.post("/:id/cancel", AuctionsController.cancel);

export default router;