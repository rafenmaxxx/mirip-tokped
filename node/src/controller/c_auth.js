import { AuthService } from "../service/s_auth.js";

export const AuthController = {
  /**
   * Handle admin login
   * POST /node/api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          status: "error",
          message: "Email dan password harus diisi",
        });
      }

      // Authenticate user
      const user = await AuthService.loginAdmin(email, password);

      // Set session
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      };

      // Save session explicitly
    req.session.save((err) => {
    if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({
        status: "error",
        message: "Gagal menyimpan session",
        });
    }

    console.log("Session saved:", req.session.user);
    console.log("Session ID:", req.sessionID);

    return res.status(200).json({
        status: "success",
        message: "Login berhasil",
        data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        },
    });
    });
    } catch (error) {
      console.error("Login controller error:", error);
      
      // Handle specific errors
      if (error.message.includes("Email atau password salah 1") || error.message.includes("Email atau password salah 2")) {
        return res.status(401).json({
          status: "error",
          message: error.message,
        });
      }

      if (error.message.includes("Akses ditolak")) {
        return res.status(403).json({
          status: "error",
          message: error.message,
        });
      }

      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({
            status: "error",
            message: "Gagal logout",
          });
        }

        res.clearCookie("connect.sid"); // Clear session cookie
        return res.status(200).json({
          status: "success",
          message: "Logout berhasil",
        });
      });
    } catch (error) {
      console.error("Logout controller error:", error);
      next(error);
    }
  },

  async getCurrentUser(req, res, next) {
    try {
    console.log("GET /auth/me called");
    console.log("Session exists:", !!req.session);
    console.log("Session user:", req.session?.user);
    console.log("Session ID:", req.sessionID);
    console.log("Cookies:", req.headers.cookie);

    // Check if session exists
    if (!req.session || !req.session.user || !req.session.user.id) {
      console.log("No session or user in session");
      return res.status(401).json({
        status: "error",
        message: "Tidak terautentikasi",
      });
    }

      // Get fresh user data from database
      const user = await AuthService.getCurrentUser(req.session.user.id);

      // Check if still admin
      if (user.role !== "ADMIN") {
        return res.status(403).json({
          status: "error",
          message: "Akses ditolak",
        });
      }

          console.log("User authenticated:", user.email);
          console.log("Session ID:", req.sessionID);
          console.log("Cookies:", req.headers.cookie);

      return res.status(200).json({
        status: "success",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          address: user.address,
        },
      });
    } catch (error) {
      console.error("Get current user error:", error);
      
      if (error.message.includes("User tidak ditemukan")) {
        return res.status(404).json({
          status: "error",
          message: error.message,
        });
      }

      next(error);
    }
  },

  async checkAuth(req, res) {
    try {
      if (req.session.user && req.session.user.role === "ADMIN") {
        return res.status(200).json({
          status: "success",
          authenticated: true,
          data: req.session.user,
        });
      }

      return res.status(401).json({
        status: "error",
        authenticated: false,
        message: "Tidak terautentikasi",
      });
    } catch (error) {
      console.error("Check auth error:", error);
      return res.status(500).json({
        status: "error",
        authenticated: false,
        message: "Terjadi kesalahan server",
      });
    }
  }
}