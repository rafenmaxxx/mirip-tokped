/**
 * src/service/s_socket.js
 * Layer layanan untuk logika bisnis terkait soket.
 * Misalnya: menyimpan pesan, memperbarui status online, dll.
 */
import db from "../config/db.js";

class SocketService {
  static async addUserOnline(userId, socketId) {
    // Menggunakan Hash untuk menyimpan ID soket pengguna (opsi 2)
    const userData = { socketId, joinTime: new Date().toISOString() };
    await redis.hSet("user_sessions", userId, JSON.stringify(userData));
    console.log(
      `[Service] User ${userId} is now online with socket ${socketId}`
    );
  }

  /**
   * Menandai pengguna sebagai offline saat terputus.
   * @param {string} userId
   */
  static async removeUserOnline(userId) {
    await redis.hDel("user_sessions", userId);
    console.log(`[Service] User ${userId} is now offline`);
  }

  /**
   * Mengambil daftar semua pengguna online beserta data sesinya.
   */
  static async getOnlineUsers() {
    const sessions = await redis.hGetAll("user_sessions");

    const onlineUsers = Object.entries(sessions).map(([userId, data]) => {
      try {
        return {
          userId,
          ...JSON.parse(data), // Parse data JSON sesi
        };
      } catch (e) {
        console.error(`Error parsing session data for ${userId}:`, e);
        return { userId, error: "Invalid data" };
      }
    });

    return onlineUsers;
  }

  static async handleNewMessage(data) {
    console.log(
      `[Service] Memproses pesan baru dari ${data.userId}: ${data.message}`
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      timestamp: new Date().toISOString(),
      ...data,
    };
  }

  static async saveMessage({
    storeId,
    buyerId,
    sender_id,
    message,
    message_type = "text",
    product_id = null,
  }) {
    console.log("[Service] Saving message:", {
      storeId,
      buyerId,
      sender_id,
      message_type,
      product_id,
      content_preview: message ? message.substring(0, 100) + "..." : "empty",
    });

    try {
      // 1. Update atau insert chat_room (PENTING!)
      const roomQuery = `
      INSERT INTO chat_room (store_id, buyer_id, last_message_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (buyer_id, store_id) 
      DO UPDATE SET 
        last_message_at = NOW(),
        updated_at = NOW()
    `;

      await db.query(roomQuery, [storeId, buyerId]);

      // 2. Insert message dengan product_id
      const messageQuery = `
      INSERT INTO chat_messages 
      (store_id, buyer_id, sender_id, message_type, content, product_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

      const result = await db.query(messageQuery, [
        storeId,
        buyerId,
        sender_id,
        message_type,
        message,
        product_id,
      ]);

      const savedMessage = result.rows[0];
      console.log(
        "[Service] Message saved successfully, ID:",
        savedMessage.message_id
      );

      // 3. Format response TANPA field 'mine'
      return {
        message_id: savedMessage.message_id,
        store_id: savedMessage.store_id,
        buyer_id: savedMessage.buyer_id,
        sender_id: savedMessage.sender_id,
        content: savedMessage.content,
        message_type: savedMessage.message_type,
        product_id: savedMessage.product_id,
        created_at: savedMessage.created_at,
        is_read:
          savedMessage.is_read !== undefined ? savedMessage.is_read : false,
        // JANGAN tambahkan 'mine' di sini
      };
    } catch (error) {
      console.error("[Service] Error saving message:", error);
      throw error;
    }
  }

  static async handleTyping({ storeId, buyerId, userId, user_name }) {
    // Log untuk debugging
    console.log("[Service] Typing event:", {
      storeId,
      buyerId,
      userId,
      user_name,
    });

    return {
      store_id: storeId,
      buyer_id: buyerId,
      user_id: userId,
      user_name: user_name || "User",
      timestamp: new Date().toISOString(),
    };
  }

  static async handleStopTyping({ storeId, buyerId, userId, user_name }) {
    console.log("[Service] Stop typing event:", {
      storeId,
      buyerId,
      userId,
      user_name,
    });

    return {
      store_id: storeId,
      buyer_id: buyerId,
      user_id: userId,
      user_name: user_name || "User",
      timestamp: new Date().toISOString(),
    };
  }

  // Helper method untuk mendapatkan messages
  static async getMessages(storeId, buyerId, offset = 0, limit = 50) {
    try {
      // Update read status untuk messages dari pengirim lain
      await db.query(
        `UPDATE chat_messages 
         SET is_read = TRUE 
         WHERE store_id = $1 
           AND buyer_id = $2 
           AND sender_id != $3 
           AND is_read = FALSE`,
        [storeId, buyerId, sender_id]
      );

      // Get messages
      const result = await db.query(
        `SELECT * FROM chat_messages 
         WHERE store_id = $1 AND buyer_id = $2
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4`,
        [storeId, buyerId, limit, offset]
      );

      // Return in chronological order
      return result.rows.reverse();
    } catch (error) {
      console.error("[Service] Error getting messages:", error);
      throw error;
    }
  }
  // Di s_socket.js, tambahkan fungsi ini ke class SocketService

  static async markMessagesAsRead(storeId, buyerId, readerId) {
    console.log("[Service] Marking messages as read:", {
      storeId,
      buyerId,
      readerId,
    });

    try {
      // Update semua pesan dari orang lain yang belum dibaca
      const result = await db.query(
        `UPDATE chat_messages 
       SET is_read = TRUE 
       WHERE store_id = $1 
         AND buyer_id = $2 
         AND sender_id != $3 
         AND is_read = FALSE
       RETURNING message_id, sender_id`,
        [storeId, buyerId, readerId]
      );

      console.log(`[Service] Marked ${result.rowCount} messages as read`);

      return {
        count: result.rowCount,
        message_ids: result.rows.map((row) => row.message_id),
      };
    } catch (error) {
      console.error("[Service] Error marking messages as read:", error);
      throw error;
    }
  }

  static async getMessageStatus(messageId) {
    try {
      const result = await db.query(
        `SELECT message_id, is_read, created_at 
       FROM chat_messages 
       WHERE message_id = $1`,
        [messageId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error("[Service] Error getting message status:", error);
      throw error;
    }
  }
}

export default SocketService;
