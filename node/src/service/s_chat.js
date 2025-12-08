import db from "../config/db.js";

export const ChatService = {
  // 1. Ambil daftar chat room untuk user
  async getChatRooms(user) {
    if (user.role === "BUYER") {
      const res = await db.query(
        `
        SELECT cr.*, s.store_name, s.store_logo_path
        FROM chat_room cr
        JOIN stores s ON s.store_id = cr.store_id
        WHERE cr.buyer_id = $1
        ORDER BY cr.last_message_at DESC NULLS LAST
        `,
        [user.user_id]
      );

      return res.rows;
    }

    if (user.role === "SELLER") {
      // seller punya 1 store
      const storeRes = await db.query(
        `SELECT store_id FROM stores WHERE user_id = $1`,
        [user.user_id]
      );

      if (storeRes.rows.length === 0) return [];

      const storeId = storeRes.rows[0].store_id;

      const res = await db.query(
        `
        SELECT cr.*, u.name AS buyer_name
        FROM chat_room cr
        JOIN users u ON u.user_id = cr.buyer_id
        WHERE cr.store_id = $1
        ORDER BY cr.last_message_at DESC NULLS LAST
        `,
        [storeId]
      );

      return res.rows;
    }

    return [];
  },

  // 2. Ambil pesan dalam sebuah room
  async getMessages(storeId, buyerId) {
    const res = await db.query(
      `
      SELECT *
      FROM chat_messages
      WHERE store_id = $1 AND buyer_id = $2
      ORDER BY created_at ASC
      `,
      [storeId, buyerId]
    );

    return res.rows;
  },

  // 3. Send message
  async sendMessage({
    store_id,
    buyer_id,
    sender_id,
    message_type,
    content,
    product_id,
  }) {
    // pastikan chat room ada
    await db.query(
      `
      INSERT INTO chat_room (store_id, buyer_id, last_message_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (buyer_id, store_id)
      DO UPDATE SET last_message_at = NOW()
      `,
      [store_id, buyer_id]
    );

    const res = await db.query(
      `
      INSERT INTO chat_messages (store_id, buyer_id, sender_id, message_type, content, product_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [store_id, buyer_id, sender_id, message_type, content, product_id || null]
    );

    return res.rows[0];
  },
};
