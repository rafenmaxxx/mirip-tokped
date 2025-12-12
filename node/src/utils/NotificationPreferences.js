import db from "../config/db.js";

class NotificationPreferences {
  static async isAllowedChatNotif(user_ids, callback) {
    const userIdArray = Array.isArray(user_ids) ? user_ids : [user_ids];

    for (const user_id of userIdArray) {
      if (!user_id) {
        throw new Error("User ID is required");
      }

      const res = await db.query(
        "SELECT chat_enabled FROM push_preferences WHERE user_id = $1",
        [user_id]
      );

      const isAllowed = res.rows.length === 0 ? true : res.rows[0].chat_enabled;

      if (callback && isAllowed) {
        callback(user_id);
      }
    }
  }

  static async isAllowedAuctionNotif(user_ids, callback) {
    const userIdArray = Array.isArray(user_ids) ? user_ids : [user_ids];

    for (const user_id of userIdArray) {
      if (!user_id) {
        throw new Error("User ID is required");
      }

      const res = await db.query(
        "SELECT auction_enabled FROM push_preferences WHERE user_id = $1",
        [user_id]
      );

      const isAllowed =
        res.rows.length === 0 ? true : res.rows[0].auction_enabled;

      if (callback && isAllowed) {
        callback(user_id);
      }
    }
  }

  static async isAllowedOrderNotif(user_ids, callback) {
    const userIdArray = Array.isArray(user_ids) ? user_ids : [user_ids];

    for (const user_id of userIdArray) {
      if (!user_id) {
        throw new Error("User ID is required");
      }

      const res = await db.query(
        "SELECT order_enabled FROM push_preferences WHERE user_id = $1",
        [user_id]
      );

      const isAllowed =
        res.rows.length === 0 ? true : res.rows[0].order_enabled;

      if (callback && isAllowed) {
        callback(user_id);
      }
    }
  }
}

export default NotificationPreferences;
