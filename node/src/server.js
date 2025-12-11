import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { ENV } from "./config/env.js";
import { initializeSocketEvents } from "./routes/r_socket.js";

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
initializeSocketEvents(io);

app.set("io", io);

httpServer.listen(ENV.PORT, () => {
  console.log(
    `Node server aman bos (HTTP & Socket.IO berjalan di port ${ENV.PORT})`
  );
});
