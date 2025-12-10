// middleware/session.js
import redis from "../config/redis.js";
import { phpUnserialize } from "../config/redis.js";

export async function getSessionUser(req) {
  try {
    const cookies = req.headers.cookie;
    if (!cookies) return null;

    const sessionCookie = cookies
      .split(";")
      .find((c) => c.trim().startsWith("PHPSESSID="));

    if (!sessionCookie) return null;

    const sessionId = sessionCookie.split("=")[1];
    const sessionKey = `PHPREDIS_SESSION:${sessionId}`;
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) return null;

    const session = phpUnserialize(sessionData);

    // Sesuaikan dengan struktur session PHP Anda
    if (session.user) {
      return session.user;
    }

    // Coba format lain
    if (session.user_data) {
      return session.user_data;
    }

    // Atau langsung dari session
    if (session.user_id) {
      return {
        user_id: session.user_id,
        email: session.email || "",
        role: session.role || "USER",
        name: session.name || "",
      };
    }

    return null;
  } catch (err) {
    console.error("Error getting session user:", err);
    return null;
  }
}

// Middleware function yang benar
export const sessionMiddleware = async (req, res, next) => {
  try {
    const user = await getSessionUser(req);
    if (user) {
      req.user = user;
    }
    next();
  } catch (err) {
    console.error("Session middleware error:", err);
    next();
  }
};
