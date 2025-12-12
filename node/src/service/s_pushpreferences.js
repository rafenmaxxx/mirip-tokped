import db from "../config/db.js";

export const PushPreferencesService = {
  /**
   * Get push preferences for a user
   * If not exists, create with default values
   */
  async getByUserId(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    let res = await db.query(
      "SELECT * FROM push_preferences WHERE user_id = $1",
      [userId]
    );

    // If not exists, create with default values
    if (res.rows.length === 0) {
      const insertRes = await db.query(
        `INSERT INTO push_preferences (user_id, chat_enabled, auction_enabled, order_enabled) 
         VALUES ($1, true, true, true) 
         RETURNING *`,
        [userId]
      );
      return insertRes.rows[0];
    }

    return res.rows[0];
  },

  /**
   * Update push preferences for a user
   */
  async update(userId, preferences) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const { chat_enabled, auction_enabled, order_enabled } = preferences;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (chat_enabled !== undefined) {
      updates.push(`chat_enabled = $${paramIndex++}`);
      values.push(chat_enabled);
    }

    if (auction_enabled !== undefined) {
      updates.push(`auction_enabled = $${paramIndex++}`);
      values.push(auction_enabled);
    }

    if (order_enabled !== undefined) {
      updates.push(`order_enabled = $${paramIndex++}`);
      values.push(order_enabled);
    }

    if (updates.length === 0) {
      throw new Error("No preferences to update");
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE push_preferences 
      SET ${updates.join(", ")}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;

    const res = await db.query(query, values);

    // If no rows updated, create new record
    if (res.rows.length === 0) {
      const insertRes = await db.query(
        `INSERT INTO push_preferences (user_id, chat_enabled, auction_enabled, order_enabled) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          userId,
          chat_enabled !== undefined ? chat_enabled : true,
          auction_enabled !== undefined ? auction_enabled : true,
          order_enabled !== undefined ? order_enabled : true,
        ]
      );
      return insertRes.rows[0];
    }

    return res.rows[0];
  },

  /**
   * Get all push preferences (admin only)
   */
  async getAll() {
    const res = await db.query(`
      SELECT pp.*, u.name, u.email, u.role 
      FROM push_preferences pp
      JOIN users u ON pp.user_id = u.user_id
      ORDER BY pp.updated_at DESC
    `);
    return res.rows;
  },

  /**
   * Delete push preferences for a user
   */
  async delete(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const res = await db.query(
      "DELETE FROM push_preferences WHERE user_id = $1 RETURNING *",
      [userId]
    );

    if (res.rows.length === 0) {
      throw new Error("Push preferences not found");
    }

    return res.rows[0];
  },

  /**
   * Reset to default values
   */
  async reset(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const res = await db.query(
      `UPDATE push_preferences 
       SET chat_enabled = true, 
           auction_enabled = true, 
           order_enabled = true,
           updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId]
    );

    if (res.rows.length === 0) {
      // Create if not exists
      const insertRes = await db.query(
        `INSERT INTO push_preferences (user_id, chat_enabled, auction_enabled, order_enabled) 
         VALUES ($1, true, true, true) 
         RETURNING *`,
        [userId]
      );
      return insertRes.rows[0];
    }

    return res.rows[0];
  },
};

class NotificationPreferences {
  static async isAllowedChatNotif(user_id, callback) {
    if (!user_id) {
      throw new Error("User ID is required");
    }

    const res = await db.query(
      "SELECT chat_enabled FROM push_preferences WHERE user_id = $1",
      [user_id]
    );

    const isAllowed = res.rows.length === 0 ? true : res.rows[0].chat_enabled;

    if (isAllowed) {
      if (callback) {
        callback(isAllowed);
      }
    } else {
      // Ask for permission if not granted
      console.log(
        `Permission not granted for user ${user_id}. Asking for permission...`
      );
      // Logic to ask for permission can be added here
    }

    return isAllowed;
  }

  static async isAllowedAuctionNotif(user_id, callback) {
    if (!user_id) {
      throw new Error("User ID is required");
    }

    const res = await db.query(
      "SELECT auction_enabled FROM push_preferences WHERE user_id = $1",
      [user_id]
    );

    const isAllowed =
      res.rows.length === 0 ? true : res.rows[0].auction_enabled;

    if (isAllowed) {
      if (callback) {
        callback(isAllowed);
      }
    } else {
      // Ask for permission if not granted
      console.log(
        `Permission not granted for user ${user_id}. Asking for permission...`
      );
      // Logic to ask for permission can be added here
    }

    return isAllowed;
  }

  static async isAllowedOrderNotif(user_id, callback) {
    if (!user_id) {
      throw new Error("User ID is required");
    }

    const res = await db.query(
      "SELECT order_enabled FROM push_preferences WHERE user_id = $1",
      [user_id]
    );

    const isAllowed = res.rows.length === 0 ? true : res.rows[0].order_enabled;

    if (isAllowed) {
      if (callback) {
        callback(isAllowed);
      }
    } else {
      // Ask for permission if not granted
      console.log(
        `Permission not granted for user ${user_id}. Asking for permission...`
      );
      // Logic to ask for permission can be added here
    }

    return isAllowed;
  }
}

export default NotificationPreferences;
