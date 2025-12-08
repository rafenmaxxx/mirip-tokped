import { ChatService } from "../service/s_chat.js";
import { UserService } from "../service/s_user.js";

export const ChatController = {
  // semua chat room user
  async getChatRooms(req, res) {
    const user = await UserService.getMe(req.cookies.PHPSESSID);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const rooms = await ChatService.getChatRooms(user);
    res.json(rooms);
  },

  // semua pesan dalam 1 room
  async getMessages(req, res) {
    const user = await UserService.getMe(req.cookies.PHPSESSID);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { storeId, buyerId } = req.params;

    const messages = await ChatService.getMessages(storeId, buyerId);
    res.json(messages);
  },

  // kirim pesan
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
};
