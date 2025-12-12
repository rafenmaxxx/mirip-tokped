import { ChatService } from "../service/s_chat.js";
import { UserService } from "../service/s_user.js";
import db from "../config/db.js";

export const ChatController = {
  async getChatRooms(req, res) {
    const user = await UserService.getMe(req.cookies.PHPSESSID);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const rooms = await ChatService.getChatRooms(user);
    res.json(rooms);
  },

  async getMessages(req, res) {
    const user = await UserService.getMe(req.cookies.PHPSESSID);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { storeId, buyerId } = req.params;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await ChatService.getMessages(
      storeId,
      buyerId,
      offset,
      limit
    );
    res.json(messages);
  },

  async sendMessage(req, res) {
    const user = await UserService.getMe(req.cookies.PHPSESSID);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { store_id, buyer_id, message_type, content, product_id } = req.body;

    const msg = await ChatService.sendMessage({
      store_id,
      buyer_id,
      sender_id: user.user_id,
      message_type,
      content,
      product_id,
    });

    res.json(msg);

  },

  // API baru: Mulai chat baru
  async startNewChat(req, res) {
    const user = await UserService.getMe(req.cookies.PHPSESSID);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Hanya buyer yang bisa mulai chat baru
    if (user.role !== "BUYER") {
      return res
        .status(403)
        .json({ message: "Hanya buyer yang bisa memulai chat baru" });
    }

    const { store_id } = req.body;
    if (!store_id) {
      return res.status(400).json({ message: "store_id diperlukan" });
    }

    try {
      const newRoom = await ChatService.startNewChat({
        buyer_id: user.user_id,
        store_id,
      });

      // Tambahkan store_name ke response
      const storeInfo = await db.query(
        `SELECT store_name FROM stores WHERE store_id = $1`,
        [store_id]
      );

      const response = {
        ...newRoom,
        store_name: storeInfo.rows[0]?.store_name || "Toko",
      };

      res.json(response);
    } catch (err) {
      console.error("Error starting new chat:", err);
      res.status(500).json({ message: "Gagal memulai chat baru" });
    }
  },

  // API baru: Daftar store untuk chat baru
  async getStoresForChat(req, res) {
    const user = await UserService.getMe(req.cookies.PHPSESSID);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Hanya buyer yang bisa melihat daftar store untuk chat
    if (user.role !== "BUYER") {
      return res
        .status(403)
        .json({ message: "Hanya buyer yang bisa mengakses daftar store" });
    }

    const { search } = req.query;
    const stores = await ChatService.getStoresForBuyer(search || "");
    res.json(stores);
  },
};
