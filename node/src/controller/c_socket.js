/**
 * src/controller/c_socket.js
 * Controller yang menangani event spesifik dari klien.
 * Menerima instance 'io' (untuk siaran global) dan 'socket' (untuk komunikasi spesifik).
 */

import SocketService from "../service/s_socket.js";

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
    console.log(
      `[Controller] Pesan diterima dari ${socket.userId}: ${data.message}`
    );

    try {
      const processedData = await SocketService.handleNewMessage({
        userId: socket.userId,
        message: data.message,
        room: data.room || "general",
      });

      this.io.to(processedData.room).emit("chat_message", processedData);
    } catch (error) {
      console.error("[Controller] Gagal memproses pesan:", error);

      socket.emit("error_message", {
        type: "chat",
        message: "Gagal mengirim pesan.",
      });
    }
  }

  handleJoinRoom(socket, room) {
    socket.join(room);
    console.log(`[Controller] ${socket.userId} bergabung ke ruangan: ${room}`);
    socket.emit("room_joined", room);
  }

  registerSocketListeners(socket) {
    const onChatMessage = (data) => this.handleChatMessage(socket, data);
    const onJoinRoom = (room) => this.handleJoinRoom(socket, room);
    const onDisconnect = () => this.handleDisconnect(socket);

    socket.on("chat_message", onChatMessage);
    socket.on("join_room", onJoinRoom);
    socket.on("disconnect", onDisconnect);
  }
}

export default SocketController;
