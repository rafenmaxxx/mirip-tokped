import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { ENV } from "./config/env.js";
import { initializeSocketEvents } from "./routes/r_socket.js";
import { UserService } from "./service/s_user.js";

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

function getPhpSessionIdFromCookie(cookie) {
  if (!cookie) return null;
  const m = cookie.match(/PHPSESSID=([^;]+)/);
  return m ? m[1] : null;
}

io.use(async (socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie || "";
    const phpSessionId = getPhpSessionIdFromCookie(cookie);
    if (!phpSessionId) {
      const err = new Error("Unauthorized: missing session");
      err.data = { status: 401 };
      return next(err);
    }

    const user = await UserService.getMe(phpSessionId);
    if (!user) {
      const err = new Error("Unauthorized: invalid session");
      err.data = { status: 401 };
      return next(err);
    }

    socket.user = { user_id: user.user_id, role: user.role || user.user_role };
    return next();
  } catch (error) {
    const err = new Error("Unauthorized");
    err.data = { status: 401 };
    return next(err);
  }
});

initializeSocketEvents(io);

app.set("io", io);

httpServer.listen(ENV.PORT, () => {
  console.log(
    `Node server aman bos (HTTP & Socket.IO berjalan di port ${ENV.PORT})`
  );
});
