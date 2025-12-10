import { io } from "socket.io-client";

class SocketManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    this.connectionStatus = "disconnected";
    this.listeners = new Map();
  }

  connect(SERVER_URL, options = {}) {
    if (this.socket?.connected) {
      return this.socket;
    }

    console.log("Membuat koneksi socket baru...");

    const defaultOptions = {
      path: "/node/api/socket.io/",
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 20000,
    };

    this.socket = io(SERVER_URL, { ...defaultOptions, ...options });

    this.setupEventListeners();
    this.startHeartbeat();

    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
      this.connectionStatus = "connected";
      this.reconnectAttempts = 0;
      this.onStatusChange?.(this.connectionStatus);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      this.connectionStatus = "disconnected";
      this.onStatusChange?.(this.connectionStatus);

      if (reason === "io server disconnect") {
        // Server memutuskan, coba reconnect
        this.socket.connect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔥 Socket connection error:", error.message);
      this.connectionStatus = "error";
      this.onStatusChange?.(this.connectionStatus);

      this.reconnectAttempts++;
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(
          `Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`
        );
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(` Reconnected on attempt ${attemptNumber}`);
      this.connectionStatus = "connected";
      this.onStatusChange?.(this.connectionStatus);
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("Reconnect error:", error.message);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Reconnect failed after all attempts");
      this.connectionStatus = "failed";
      this.onStatusChange?.(this.connectionStatus);
    });

    // Custom heartbeat event
    this.socket.on("pong", () => {
      console.log("Heartbeat received");
    });
  }

  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("ping", { timestamp: Date.now() });
        console.log("Heartbeat sent");
      }
    }, 30000); // Kirim ping setiap 30 detik
  }

  joinRoom(roomData) {
    if (!this.socket?.connected || !roomData) return;

    this.socket.emit("join_room", roomData);
  }

  sendMessage(messageData) {
    if (!this.socket?.connected) {
      console.error("Cannot send message: Socket not connected");
      return false;
    }

    this.socket.emit("chat_message", messageData);
    return true;
  }

  markAsRead(readData) {
    if (!this.socket?.connected) return false;

    this.socket.emit("mark_as_read", readData);
    return true;
  }

  sendTyping(typingData) {
    if (!this.socket?.connected) return false;

    this.socket.emit("typing", typingData);
    return true;
  }

  sendStopTyping(stopTypingData) {
    if (!this.socket?.connected) return false;

    this.socket.emit("stop_typing", stopTypingData);
    return true;
  }

  on(event, handler) {
    if (!this.socket) return;

    this.socket.on(event, handler);

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  off(event, handler) {
    if (!this.socket) return;

    if (handler) {
      this.socket.off(event, handler);
    } else {
      this.socket.off(event);
    }
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.socket) {
      // Hapus semua listeners
      this.listeners.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          this.socket.off(event, handler);
        });
      });
      this.listeners.clear();

      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionStatus = "disconnected";
    this.onStatusChange?.(this.connectionStatus);

    console.log("Socket disconnected");
  }

  getStatus() {
    return {
      status: this.connectionStatus,
      connected: this.socket?.connected || false,
      id: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Singleton instance
export const socketManager = new SocketManager();
