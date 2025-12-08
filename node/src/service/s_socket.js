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

    // Mengembalikan hanya ID pengguna untuk kesederhanaan (atau kembalikan objek lengkap)
    // return onlineUsers.map(u => u.userId);
    return onlineUsers; // Kembalikan objek lengkap
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
    message_type,
  }) {
    const result = await db.query(
      `INSERT INTO chat_messages 
      (store_id, buyer_id, sender_id, message_type, content)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
      [storeId, buyerId, sender_id, message_type, message]
    );

    return {
      ...result.rows[0],
      mine: false, // frontend akan override
    };
  }
}

export default SocketService;
