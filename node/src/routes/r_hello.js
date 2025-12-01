import { Router } from "express";
import { hello } from "../controller/c_hello.js";

const router = Router();

router.get("/hello", hello);

export default router;
