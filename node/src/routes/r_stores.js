import { Router }   from "express";
import { StoresController } from "../controller/c_stores.js";

const router = Router();

router.get("/", StoresController.getAllStores);
router.get("/:id", StoresController.getStoreByUserId);

export default router;