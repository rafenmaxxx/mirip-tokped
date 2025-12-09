import SocketService from "../service/s_socket.js";
import { UserService } from "../service/s_user.js"; // pastikan ada UserService

class SocketController {
  constructor(io) {
    this.io = io;
  }

  handleConnection(socket) {
    console.log(`[Controller] Klien terhubung: ${socket.id}`);

    socket.userId = `user_${Math.floor(Math.random() * 100)}`;
    console.log(`[Controller] Socket ${socket.id} diberi ID: ${socket.userId}`);

    this.io.emit("user_connected", { id: socket.id, userId: socket.userId });

    this.registerSocketListeners(socket);
  }

  handleDisconnect(socket) {
    console.log(`[Controller] Klien terputus: ${socket.id} (${socket.userId})`);

    this.io.emit("user_disconnected", { id: socket.id, userId: socket.userId });
  }

  // c_socket.js - bagian handleChatMessage
  async handleChatMessage(socket, data) {
    const { storeId, buyerId, message, message_type, product_id } = data;

    // Validasi lebih ketat
    if (!storeId || !buyerId || !message) {
      console.error("[Controller] Incomplete message data:", data);
      socket.emit("error_message", {
        type: "chat",
        message: "Data pesan tidak lengkap",
        data: data,
      });
      return;
    }

    // Ambil PHPSESSID dari cookie handshake
    const cookie = socket.handshake.headers.cookie || "";
    const match = cookie.match(/PHPSESSID=([^;]+)/);
    const phpSessionId = match ? match[1] : null;

    if (!phpSessionId) {
      socket.emit("error_message", {
        type: "chat",
        message: "Tidak ada sesi login",
      });
      return;
    }

    // Ambil user dari session
    const user = await UserService.getMe(phpSessionId);
    if (!user) {
      socket.emit("error_message", {
        type: "chat",
        message: "User tidak ditemukan / tidak login",
      });
      return;
    }

    const sender_id = user.user_id;
    const roomKey = `${storeId}-${buyerId}`;

    // Join room jika belum
    if (!socket.rooms.has(roomKey)) {
      console.log(`[Controller] ${socket.id} joining room ${roomKey}`);
      socket.join(roomKey);
    }

    console.log(
      `[Controller] New message from ${sender_id} in room ${roomKey}`,
      {
        message_type,
        product_id,
        content_length: message.length,
      }
    );

    try {
      const saved = await SocketService.saveMessage({
        storeId,
        buyerId,
        sender_id,
        message,
        message_type: message_type || "text",
        product_id: product_id || null,
      });

      // Debug log
      console.log(
        `[Controller] Message saved, broadcasting to room ${roomKey}:`,
        {
          message_id: saved.message_id,
          message_type: saved.message_type,
        }
      );

      // Broadcast ke semua di room termasuk sender
      this.io.to(roomKey).emit("new_message", saved);
    } catch (error) {
      console.error("[Controller] Error handling chat message:", error);
      socket.emit("error_message", {
        type: "chat",
        message: "Gagal mengirim pesan: " + error.message,
      });
    }
  }
  // Di dalam class SocketController
  async handleTyping(socket, data) {
    const { store_id, buyer_id, user_id, user_name } = data;
    const roomKey = `${store_id}-${buyer_id}`;

    console.log(`User ${user_id} typing in room ${roomKey}`);

    // Broadcast ke semua client di room kecuali pengirim
    socket.to(roomKey).emit("typing", {
      store_id,
      buyer_id,
      user_id,
      user_name,
      timestamp: new Date().toISOString(),
    });
  }

  async handleStopTyping(socket, data) {
    const { store_id, buyer_id, user_id, user_name } = data;
    const roomKey = `${store_id}-${buyer_id}`;

    console.log(`User ${user_id} stopped typing in room ${roomKey}`);

    // Broadcast ke semua client di room kecuali pengirim
    socket.to(roomKey).emit("stop_typing", {
      store_id,
      buyer_id,
      user_id,
      user_name,
      timestamp: new Date().toISOString(),
    });
  }

  handleJoinRoom(socket, { storeId, buyerId }) {
    const roomKey = `${storeId}-${buyerId}`;
    socket.join(roomKey);

    console.log(`[socket] ${socket.userId} join room ${roomKey}`);
    socket.emit("room_joined", roomKey);
  }

  async handleMarkAsRead(socket, data) {
    const { storeId, buyerId } = data;

    // Ambil user dari session
    const cookie = socket.handshake.headers.cookie || "";
    const match = cookie.match(/PHPSESSID=([^;]+)/);
    const phpSessionId = match ? match[1] : null;

    if (!phpSessionId) {
      socket.emit("error_message", {
        type: "read_status",
        message: "Tidak ada sesi login",
      });
      return;
    }

    const user = await UserService.getMe(phpSessionId);
    if (!user) {
      socket.emit("error_message", {
        type: "read_status",
        message: "User tidak ditemukan",
      });
      return;
    }

    const readerId = user.user_id;
    const roomKey = `${storeId}-${buyerId}`;

    console.log(
      `[Controller] Marking messages as read in room ${roomKey} by ${readerId}`
    );

    try {
      const result = await SocketService.markMessagesAsRead(
        storeId,
        buyerId,
        readerId
      );

      // Broadcast ke semua di room bahwa pesan telah dibaca
      this.io.to(roomKey).emit("messages_read", {
        store_id: storeId,
        buyer_id: buyerId,
        reader_id: readerId,
        message_ids: result.message_ids,
        count: result.count,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[Controller] Broadcast read status for ${result.count} messages`
      );
    } catch (error) {
      console.error("[Controller] Error marking messages as read:", error);
      socket.emit("error_message", {
        type: "read_status",
        message: "Gagal update status baca",
      });
    }
  }

  registerSocketListeners(socket) {
    socket.on("chat_message", (data) => this.handleChatMessage(socket, data));
    socket.on("join_room", (room) => this.handleJoinRoom(socket, room));
    socket.on("disconnect", () => this.handleDisconnect(socket));
    socket.on("typing", (data) => this.handleTyping(socket, data));
    socket.on("stop_typing", (data) => this.handleStopTyping(socket, data));
    socket.on("mark_as_read", (data) => this.handleMarkAsRead(socket, data));
  }
}

export default SocketController;
