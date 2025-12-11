import { ProductsService } from "../service/s_products.js";

export const ProductsController = {
  async getProductByStoreId(req, res) {
    try {
      const product = await ProductsService.getProductByStoreId(req.params.storeId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Error getting product by store id:', error);
      res.status(500).json({ message: 'Failed to fetch product' });
    }
  },

  async getAllProducts(req, res) {
    try {
      const products = await ProductsService.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Error getting all products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  },
};