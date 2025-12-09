import { verifyToken } from "../utils/jwt.js";

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Tidak terautentikasi. Token tidak ditemukan.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    req.user = decoded;

    console.log("User authenticated:", decoded.email);
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    return res.status(401).json({
      status: "error",
      message: error.message || "Token tidak valid atau expired",
    });
  }
};

const requireAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Tidak terautentikasi. Token tidak ditemukan.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({
        status: "error",
        message: "Akses ditolak. Hanya admin yang dapat mengakses.",
      });
    }
    req.user = decoded;

    console.log("Admin authenticated:", decoded.email);
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error.message);

    return res.status(401).json({
      status: "error",
      message: error.message || "Token tidak valid atau expired",
    });
  }
};

export { requireAuth, requireAdmin };
