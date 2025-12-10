import db from "../config/db.js";

export const StoresService = {
    async getStoreByUserId(userId) {
        const res = await db.query(
            `SELECT store_id, store_name, store_logo_path, store_description, created_at
             FROM stores
             WHERE user_id = $1`,
            [userId]
        );
        return res.rows[0];
    },

    async getAllStores() {
        const res = await db.query(
            `SELECT store_id, store_name, store_logo_path, store_description, created_at
             FROM stores`
        );
        return res.rows;
    },
}; 