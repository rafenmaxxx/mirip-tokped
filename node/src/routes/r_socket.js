/**
 * src/routes/r_socket.js
 * Inisialisasi event listener koneksi Socket.IO.
 * Ini adalah titik masuk modular untuk semua event soket.
 */
import SocketController from "../controller/c_socket.js";

const initializeSocketEvents = (io) => {
  const socketController = new SocketController(io);

  io.on("connection", (socket) => {
    socketController.handleConnection(socket);
  });

  console.log("[Socket Routes] Socket.IO events successfully initialized.");
};

export { initializeSocketEvents };
