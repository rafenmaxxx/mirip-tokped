/**
 * src/service/s_socket.js
 * Layer layanan untuk logika bisnis terkait soket.
 * Misalnya: menyimpan pesan, memperbarui status online, dll.
 */

class SocketService {
  static async handleNewMessage(data) {
    console.log(
      `[Service] Memproses pesan baru dari ${data.userId}: ${data.message}`
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      timestamp: new Date().toISOString(),
      ...data,
    };
  }

  static async getOnlineUsers() {
    return ["UserA", "UserB", "UserC"];
  }
}

export default SocketService;
