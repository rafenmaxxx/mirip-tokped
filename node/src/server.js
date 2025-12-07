/**
 * src/server.js
 * Titik masuk utama aplikasi, menggabungkan Express dan Socket.IO.
 */
import http from "http";
import { Server } from "socket.io";

// Asumsi 'app.js' mengekspor aplikasi Express Anda
import app from "./app.js";
// Asumsi 'env.js' mengekspor objek ENV
import { ENV } from "./config/env.js";
// Mengimpor fungsi inisialisasi socket dari r_socket.js
import { initializeSocketEvents } from "./routes/r_socket.js";

// 1. Membuat HTTP Server dari Express App
// Socket.IO memerlukan server HTTP, bukan hanya instance Express.
const httpServer = http.createServer(app);

// 2. Inisialisasi Socket.IO dan pasang ke HTTP Server
const io = new Server(httpServer, {
  // Konfigurasi CORS agar klien dari mana saja dapat terhubung
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 3. Inisialisasi Event Socket Modular
// Memanggil fungsi dari r_socket.js untuk mendaftarkan semua event handler
initializeSocketEvents(io);

// 4. Menjalankan Server
// Menggunakan httpServer untuk mendengarkan, bukan app
httpServer.listen(ENV.PORT, () => {
  console.log(
    `Node server aman bos (HTTP & Socket.IO berjalan di port ${ENV.PORT})`
  );
});
