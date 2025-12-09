import db from "../config/db.js";

export const ChatService = {
  async getChatRooms(user) {
    if (user.role === "BUYER") {
      const res = await db.query(
        `
        SELECT 
          cr.*, 
          s.store_name, 
          s.store_logo_path,
          (
            SELECT cm.content 
            FROM chat_messages cm 
            WHERE cm.store_id = cr.store_id 
              AND cm.buyer_id = cr.buyer_id 
            ORDER BY cm.created_at DESC 
            LIMIT 1
          ) as last_message_content,
          (
            SELECT cm.created_at 
            FROM chat_messages cm 
            WHERE cm.store_id = cr.store_id 
              AND cm.buyer_id = cr.buyer_id 
            ORDER BY cm.created_at DESC 
            LIMIT 1
          ) as last_message_at,
          (
            SELECT COUNT(*) 
            FROM chat_messages cm 
            WHERE cm.store_id = cr.store_id 
              AND cm.buyer_id = cr.buyer_id 
              AND cm.sender_id != $1
              AND cm.is_read = FALSE
          ) as unread_count
        FROM chat_room cr
        JOIN stores s ON s.store_id = cr.store_id
        WHERE cr.buyer_id = $1
        ORDER BY COALESCE(
          (SELECT cm.created_at 
           FROM chat_messages cm 
           WHERE cm.store_id = cr.store_id 
             AND cm.buyer_id = cr.buyer_id 
           ORDER BY cm.created_at DESC 
           LIMIT 1),
          cr.created_at
        ) DESC
        `,
        [user.user_id]
      );

      // Format response agar sesuai dengan frontend
      return res.rows.map((row) => ({
        ...row,
        last_message: row.last_message_content
          ? {
              content: row.last_message_content,
              created_at: row.last_message_at,
            }
          : null,
        last_message_at: row.last_message_at || row.updated_at,
        unread_count: parseInt(row.unread_count) || 0,
      }));
    }

    if (user.role === "SELLER") {
      const storeRes = await db.query(
        `SELECT store_id FROM stores WHERE user_id = $1`,
        [user.user_id]
      );

      if (storeRes.rows.length === 0) return [];

      const storeId = storeRes.rows[0].store_id;

      const res = await db.query(
        `
        SELECT 
          cr.*, 
          u.name AS buyer_name,
          u.email AS buyer_email,
          (
            SELECT cm.content 
            FROM chat_messages cm 
            WHERE cm.store_id = cr.store_id 
              AND cm.buyer_id = cr.buyer_id 
            ORDER BY cm.created_at DESC 
            LIMIT 1
          ) as last_message_content,
          (
            SELECT cm.created_at 
            FROM chat_messages cm 
            WHERE cm.store_id = cr.store_id 
              AND cm.buyer_id = cr.buyer_id 
            ORDER BY cm.created_at DESC 
            LIMIT 1
          ) as last_message_at,
          (
            SELECT COUNT(*) 
            FROM chat_messages cm 
            WHERE cm.store_id = cr.store_id 
              AND cm.buyer_id = cr.buyer_id 
              AND cm.sender_id != $1
              AND cm.is_read = FALSE
          ) as unread_count
        FROM chat_room cr
        JOIN users u ON u.user_id = cr.buyer_id
        WHERE cr.store_id = $1
        ORDER BY COALESCE(
          (SELECT cm.created_at 
           FROM chat_messages cm 
           WHERE cm.store_id = cr.store_id 
             AND cm.buyer_id = cr.buyer_id 
           ORDER BY cm.created_at DESC 
           LIMIT 1),
          cr.created_at
        ) DESC
        `,
        [storeId]
      );

      // Format response agar sesuai dengan frontend
      return res.rows.map((row) => ({
        ...row,
        last_message: row.last_message_content
          ? {
              content: row.last_message_content,
              created_at: row.last_message_at,
            }
          : null,
        last_message_at: row.last_message_at || row.updated_at,
        unread_count: parseInt(row.unread_count) || 0,
      }));
    }

    return [];
  },

  async getMessages(storeId, buyerId, offset = 0, limit = 50) {
    // Pertama, tandai pesan sebagai sudah dibaca
    await db.query(
      `
      UPDATE chat_messages 
      SET is_read = TRUE 
      WHERE store_id = $1 
        AND buyer_id = $2 
        AND is_read = FALSE
      `,
      [storeId, buyerId]
    );

    // Kemambil ambil pesan
    const res = await db.query(
      `
      SELECT *
      FROM chat_messages
      WHERE store_id = $1 AND buyer_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
      `,
      [storeId, buyerId, limit, offset]
    );

    // Return in chronological order for display
    return res.rows.reverse();
  },

  async sendMessage({
    store_id,
    buyer_id,
    sender_id,
    message_type,
    content,
    product_id,
  }) {
    // Update chat room dengan last_message_at
    await db.query(
      `
      INSERT INTO chat_room (store_id, buyer_id, last_message_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (buyer_id, store_id)
      DO UPDATE SET 
        last_message_at = NOW(),
        updated_at = NOW()
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

  // Tambahan: Mulai chat baru (untuk buyer)
  async startNewChat({ buyer_id, store_id }) {
    // Cek apakah chat room sudah ada
    const existingRoom = await db.query(
      `
      SELECT cr.*, s.store_name
      FROM chat_room cr
      JOIN stores s ON s.store_id = cr.store_id
      WHERE cr.buyer_id = $1 AND cr.store_id = $2
      `,
      [buyer_id, store_id]
    );

    if (existingRoom.rows.length > 0) {
      return existingRoom.rows[0];
    }

    // Buat chat room baru
    const res = await db.query(
      `
      INSERT INTO chat_room (store_id, buyer_id, last_message_at)
      VALUES ($1, $2, NOW())
      RETURNING *
      `,
      [store_id, buyer_id]
    );

    // Dapatkan store name untuk response
    const storeInfo = await db.query(
      `SELECT store_name FROM stores WHERE store_id = $1`,
      [store_id]
    );

    const newRoom = res.rows[0];
    return {
      ...newRoom,
      store_name: storeInfo.rows[0]?.store_name || "Toko",
    };
  },

  // Tambahan: Ambil daftar store untuk buyer
  async getStoresForBuyer(search = "") {
    let query = `
      SELECT 
        s.store_id as id,
        s.store_name as name,
        s.store_logo_path as logo,
        s.store_description as description,
        (SELECT name FROM categories c 
         JOIN category_items ci ON c.category_id = ci.category_id
         JOIN products p ON ci.product_id = p.product_id
         WHERE p.store_id = s.store_id 
         LIMIT 1) as category
      FROM stores s
      WHERE s.store_id IS NOT NULL
    `;

    const params = [];

    if (search.trim()) {
      query += ` AND (s.store_name ILIKE $1 OR s.store_description ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY s.store_name ASC`;

    const res = await db.query(query, params);
    return res.rows;
  },
};
