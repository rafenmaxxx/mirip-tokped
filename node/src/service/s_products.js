import db from "../config/db.js";

export const ProductsService = {
  async getProductByStoreId(storeId) {
    const res = await db.query(
      `SELECT products.product_id, product_name, categories.name AS category, stock, description, main_image_path, price, created_at
       FROM products join category_items ON products.product_id = category_items.product_id join categories ON category_items.category_id = categories.category_id
       WHERE store_id = $1`,
      [storeId]
    );
    return res.rows;
  },

  async getAllProducts() {
    const res = await db.query(
      `SELECT products.product_id, product_name, categories.name AS category, stock, description, main_image_path, price, created_at
       FROM products join category_items ON products.product_id = category_items.product_id join categories ON category_items.category_id = categories.category_id`
    );
    return res.rows;
  },
};