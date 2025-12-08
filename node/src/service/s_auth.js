import db from "../config/db.js";

export const AuthService = {
  async loginAdmin(email, password) {
    try {
      const result = await db.query(
        "SELECT user_id, name, email, password, role, address FROM users WHERE email = $1",
        [email]
      );

      const rows = result.rows;
      if (rows.length === 0) {
        throw new Error("Email atau password salah 1");
      }

      const user = rows[0];

      // Check if user is admin
      if (user.role !== "ADMIN") {
        throw new Error("Akses ditolak. Hanya admin yang dapat login di halaman ini.");
      }

      // Verify password
      const isPasswordValid = password == user.password;
      if (!isPasswordValid) {
        throw new Error("Email atau password salah 2");
      }

      return {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      };
    } catch (error) {
      console.error("Login service error:", error);
      throw error;
    }
  },

  async getCurrentUser(userId) {
    try {
      const result = await db.query(
        "SELECT user_id, name, email, role, address FROM users WHERE user_id = $1",
        [userId]
      );

      const rows = result.rows;

      if (rows.length === 0) {
        throw new Error("User tidak ditemukan");
      }

      const user = rows[0];

      return {
        id: user.user_id, 
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      };
    } catch (error) {
      console.error("Get current user error:", error);
      throw error;
    }
  }
}