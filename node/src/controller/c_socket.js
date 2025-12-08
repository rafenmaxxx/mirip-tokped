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

  async handleChatMessage(socket, data) {
    const { storeId, buyerId, message, message_type } = data;

    // Validasi
    if (!storeId || !buyerId || !message) {
      socket.emit("error_message", {
        type: "chat",
        message: "Data pesan tidak lengkap",
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

    // Pastikan socket sudah join room
    if (!socket.rooms.has(roomKey)) {
      console.warn(
        `[socket] ${socket.userId} belum join room ${roomKey}, join dulu`
      );
      socket.join(roomKey);
    }

    console.log(`[socket] Pesan baru dari ${sender_id} di room ${roomKey}`);

    try {
      const saved = await SocketService.saveMessage({
        storeId,
        buyerId,
        sender_id,
        message,
        message_type,
      });

      this.io.to(roomKey).emit("new_message", saved);
      console.log("bagi-bagi message ke ", roomKey, " -> ", saved);
    } catch (error) {
      console.error("[socket] Error:", error);
      socket.emit("error_message", {
        type: "chat",
        message: "Gagal mengirim pesan",
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

  registerSocketListeners(socket) {
    socket.on("chat_message", (data) => this.handleChatMessage(socket, data));
    socket.on("join_room", (room) => this.handleJoinRoom(socket, room));
    socket.on("disconnect", () => this.handleDisconnect(socket));
    socket.on("typing", (data) => this.handleTyping(socket, data));
    socket.on("stop_typing", (data) => this.handleStopTyping(socket, data));
  }
}

export default SocketController;
