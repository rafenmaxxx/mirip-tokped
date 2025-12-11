import { Router } from "express";
import { AuctionsController } from "../controller/c_auctions.js";

const router = Router();

router.get("/", AuctionsController.getAll);
router.get("/:id", AuctionsController.getById);
router.post("/", AuctionsController.create);
router.post("/:id/stop", (req, res) => AuctionsController.stop(req, res));

router.delete("/:id", AuctionsController.remove);

export default router;
