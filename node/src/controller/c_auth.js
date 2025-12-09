import { AuthService } from "../service/s_auth.js";
import { generateToken, generateRefreshToken } from "../utils/jwt.js";

export const AuthController = {
  /**
   * Handle admin login with JWT
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

      // Generate JWT tokens
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };

      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      console.log("Login successful for:", user.email);
      console.log("JWT token generated");

      return res.status(200).json({
        status: "success",
        message: "Login berhasil",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            address: user.address,
          },
          accessToken: accessToken,
          refreshToken: refreshToken,
          tokenType: "Bearer",
        },
      });
    } catch (error) {
      console.error("Login controller error:", error);

      // Handle specific errors
      if (error.message.includes("Email atau password salah")) {
        return res.status(401).json({
          status: "error",
          message: "Email atau password salah",
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

  /**
   * Handle logout with JWT -> remove token
   * POST /node/api/auth/logout
   */
  async logout(req, res, next) {
    try {
      console.log("Logout successful");

      return res.status(200).json({
        status: "success",
        message: "Logout berhasil. Hapus token dari client.",
      });
    } catch (error) {
      console.error("Logout controller error:", error);
      next(error);
    }
  },

  /**
   * GET /node/api/auth/me
   * Requires Authorization: Bearer <token>
   */
  async getCurrentUser(req, res, next) {
    try {
      console.log("GET /auth/me called");
      console.log("User from JWT:", req.user);

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: "error",
          message: "Tidak terautentikasi",
        });
      }

      // Get fresh user data from database
      const user = await AuthService.getCurrentUser(req.user.id);

      // Check if still admin
      if (user.role !== "ADMIN") {
        return res.status(403).json({
          status: "error",
          message: "Akses ditolak",
        });
      }

      console.log("User authenticated:", user.email);

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
      console.error("❌ Get current user error:", error);

      if (error.message.includes("User tidak ditemukan")) {
        return res.status(404).json({
          status: "error",
          message: error.message,
        });
      }

      next(error);
    }
  },

  /**
   * GET /node/api/auth/check
   * Requires Authorization: Bearer <token>
   */
  async checkAuth(req, res) {
    try {
      if (req.user && req.user.role === "ADMIN") {
        return res.status(200).json({
          status: "success",
          authenticated: true,
          data: req.user,
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
  },

  /**
   * POST /node/api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          status: "error",
          message: "Refresh token diperlukan",
        });
      }

      // Verify refresh token
      const { verifyToken } = await import("../utils/jwt.js");
      const decoded = verifyToken(refreshToken);

      // Generate new access token
      const newAccessToken = generateToken({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      });

      console.log("Token refreshed for:", decoded.email);

      return res.status(200).json({
        status: "success",
        message: "Token berhasil di-refresh",
        data: {
          accessToken: newAccessToken,
          tokenType: "Bearer",
        },
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      return res.status(401).json({
        status: "error",
        message: "Refresh token tidak valid atau expired",
      });
    }
  },
};
