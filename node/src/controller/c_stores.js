import { StoresService } from "../service/s_stores.js";

export const StoresController = {
    async getStoreByUserId(req, res) {
        try {
            const store = await StoresService.getStoreByUserId(req.params.id);
            if (!store) {
                return res.status(404).json({ message: 'Store not found' });
            }
            res.json(store);
        } catch (error) {
            console.error('Error getting store by user id:', error);
            res.status(500).json({ message: 'Failed to fetch store' });
        }
    },

    async getAllStores(req, res) {
        try {
            const stores = await StoresService.getAllStores();
            res.json(stores);
        } catch (error) {
            console.error('Error getting all stores:', error);
            res.status(500).json({ message: 'Failed to fetch stores' });
        }
    },
};