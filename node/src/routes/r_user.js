import { Router } from "express";
import { UserController } from "../controller/c_user.js";

const router = Router();

router.get("/me", UserController.getMe);
router.get("/me/:sessid", UserController.getMe);
router.get("/", UserController.getAll);
router.get("/:id", UserController.getById);
router.post("/", UserController.create);
router.delete("/:id", UserController.remove);

export default router;
