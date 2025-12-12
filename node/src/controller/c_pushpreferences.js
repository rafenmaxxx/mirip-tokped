import { PushPreferencesService } from "../service/s_pushpreferences.js";
import { UserService } from "../service/s_user.js";

export const PushPreferencesController = {
  // Get push preferences for current user
  // GET /api/push-preferences/me
  async getMe(req, res, next) {
    try {
      console.log("Push preferences getMe - cookies:", req.cookies);
      console.log("Push preferences getMe - PHPSESSID:", req.cookies.PHPSESSID);
      
      // Get user from PHP session
      const user = await UserService.getMe(req.cookies.PHPSESSID);
      
      console.log("Push preferences getMe - user:", user ? user.user_id : "null");

      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "User not authenticated",
        });
      }

      const preferences = await PushPreferencesService.getByUserId(user.user_id);

      return res.status(200).json({
        status: "success",
        message: "Berhasil mendapatkan preferensi notifikasi",
        data: preferences,
      });
    } catch (error) {
      console.error("Get push preferences error:", error);
      next(error);
    }
  },

  // Get push preferences by user ID
  // GET /api/push-preferences/:userId
  async getByUserId(req, res, next) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid user ID",
        });
      }

      const preferences = await PushPreferencesService.getByUserId(userId);

      return res.status(200).json({
        status: "success",
        message: "Berhasil mendapatkan preferensi notifikasi",
        data: preferences,
      });
    } catch (error) {
      console.error("Get push preferences by user ID error:", error);
      next(error);
    }
  },

  // Get all push preferences
  // GET /api/push-preferences/all
  async getAll(req, res, next) {
    try {
      const preferences = await PushPreferencesService.getAll();

      return res.status(200).json({
        status: "success",
        message: "Berhasil mendapatkan semua preferensi notifikasi",
        data: preferences,
        total: preferences.length,
      });
    } catch (error) {
      console.error("Get all push preferences error:", error);
      next(error);
    }
  },

  // Update push preferences for current user
  // PUT /api/push-preferences/me
  async updateMe(req, res, next) {
    try {
      // Get user from PHP session
      const user = await UserService.getMe(req.cookies.PHPSESSID);

      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "User not authenticated",
        });
      }

      const { chat_enabled, auction_enabled, order_enabled } = req.body;

      // Validate at least one field is provided
      if (
        chat_enabled === undefined &&
        auction_enabled === undefined &&
        order_enabled === undefined
      ) {
        return res.status(400).json({
          status: "error",
          message: "At least one preference field is required",
        });
      }

      // Validate boolean values
      if (
        (chat_enabled !== undefined && typeof chat_enabled !== "boolean") ||
        (auction_enabled !== undefined &&
          typeof auction_enabled !== "boolean") ||
        (order_enabled !== undefined && typeof order_enabled !== "boolean")
      ) {
        return res.status(400).json({
          status: "error",
          message: "Preference values must be boolean",
        });
      }

      const preferences = await PushPreferencesService.update(user.user_id, {
        chat_enabled,
        auction_enabled,
        order_enabled,
      });

      return res.status(200).json({
        status: "success",
        message: "Preferensi notifikasi berhasil diperbarui",
        data: preferences,
      });
    } catch (error) {
      console.error("Update push preferences error:", error);
      next(error);
    }
  },

  // Update push preferences for specific user
  // PUT /api/push-preferences/:userId
  async updateByUserId(req, res, next) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid user ID",
        });
      }

      const { chat_enabled, auction_enabled, order_enabled } = req.body;

      // Validate at least one field is provided
      if (
        chat_enabled === undefined &&
        auction_enabled === undefined &&
        order_enabled === undefined
      ) {
        return res.status(400).json({
          status: "error",
          message: "At least one preference field is required",
        });
      }

      // Validate boolean values
      if (
        (chat_enabled !== undefined && typeof chat_enabled !== "boolean") ||
        (auction_enabled !== undefined &&
          typeof auction_enabled !== "boolean") ||
        (order_enabled !== undefined && typeof order_enabled !== "boolean")
      ) {
        return res.status(400).json({
          status: "error",
          message: "Preference values must be boolean",
        });
      }

      const preferences = await PushPreferencesService.update(userId, {
        chat_enabled,
        auction_enabled,
        order_enabled,
      });

      return res.status(200).json({
        status: "success",
        message: "Preferensi notifikasi berhasil diperbarui",
        data: preferences,
      });
    } catch (error) {
      console.error("Update push preferences by user ID error:", error);
      next(error);
    }
  },

  // Reset preferences to default
  // POST /api/push-preferences/reset
  async reset(req, res, next) {
    try {
      // Get user from PHP session
      const user = await UserService.getMe(req.cookies.PHPSESSID);

      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "User not authenticated",
        });
      }

      const preferences = await PushPreferencesService.reset(user.user_id);

      return res.status(200).json({
        status: "success",
        message: "Preferensi notifikasi berhasil direset ke default",
        data: preferences,
      });
    } catch (error) {
      console.error("Reset push preferences error:", error);
      next(error);
    }
  },

  // Delete push preferences
  // DELETE /api/push-preferences/:userId
  async delete(req, res, next) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid user ID",
        });
      }

      const deleted = await PushPreferencesService.delete(userId);

      return res.status(200).json({
        status: "success",
        message: "Preferensi notifikasi berhasil dihapus",
        data: deleted,
      });
    } catch (error) {
      if (error.message === "Push preferences not found") {
        return res.status(404).json({
          status: "error",
          message: "Preferensi notifikasi tidak ditemukan",
        });
      }
      console.error("Delete push preferences error:", error);
      next(error);
    }
  },
};
