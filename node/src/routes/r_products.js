import { ProductsController } from "../controller/c_products.js";
import { Router } from "express";   

const router = Router();

router.get("/store/:storeId", ProductsController.getProductByStoreId);
router.get("/", ProductsController.getAllProducts);

export default router;

