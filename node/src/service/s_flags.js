import db from "../config/db.js";

export const FlagsService = {
  // Check if a feature is enabled globally
  // {string} featureName - 'checkout_enabled', 'chat_enabled', 'auction_enabled'
  async isGlobalFeatureEnabled(featureName) {
    try {
      const query = `
        SELECT is_enabled 
        FROM user_feature_access 
        WHERE feature_name = $1 AND user_id IS NULL
      `;
      const result = await db.query(query, [featureName]);

      // If no global setting exists, default to true
      if (result.rows.length === 0) {
        return true;
      }

      return result.rows[0].is_enabled;
    } catch (error) {
      console.error("Error checking global feature:", error);
      return false;
    }
  },

  // Check if a feature is enabled for specific user
  // {number} userId - User ID
  // {string} featureName - 'checkout_enabled', 'chat_enabled', 'auction_enabled'
  async isUserFeatureEnabled(userId, featureName) {
    try {
      const userQuery = `
        SELECT is_enabled 
        FROM user_feature_access 
        WHERE feature_name = $1 AND user_id = $2
      `;
      const userResult = await db.query(userQuery, [featureName, userId]);

      // If user-specific setting exists, use it
      if (userResult.rows.length > 0) {
        return userResult.rows[0].is_enabled;
      }

      // kalau ga user-spesific,check global setting
      return await this.isGlobalFeatureEnabled(featureName);
    } catch (error) {
      console.error("Error checking user feature:", error);
      return false;
    }
  },

  // Get all global feature flags
  // returns { checkout_enabled, chat_enabled, auction_enabled }
  async getAllGlobalFlags() {
    try {
      const query = `
        SELECT feature_name, is_enabled 
        FROM user_feature_access 
        WHERE user_id IS NULL
      `;
      const result = await db.query(query);

      const flags = {
        checkout_enabled: true,
        chat_enabled: true,
        auction_enabled: true,
      };

      result.rows.forEach((row) => {
        flags[row.feature_name] = row.is_enabled;
      });

      return flags;
    } catch (error) {
      console.error("Error getting global flags:", error);
      return {
        checkout_enabled: true,
        chat_enabled: true,
        auction_enabled: true,
      };
    }
  },

  // Get all feature flags for specific user
  // {number} userId - User ID
  // returns { checkout_enabled, chat_enabled, auction_enabled }
  async getUserFlags(userId) {
    try {
      const globalFlags = await this.getAllGlobalFlags();

      // Get user-specific overrides
      const query = `
        SELECT feature_name, is_enabled 
        FROM user_feature_access 
        WHERE user_id = $1
      `;
      const result = await db.query(query, [userId]);

      // Override global flags with user-specific settings
      result.rows.forEach((row) => {
        globalFlags[row.feature_name] = row.is_enabled;
      });

      return globalFlags;
    } catch (error) {
      console.error("Error getting user flags:", error);
      return {
        checkout_enabled: true,
        chat_enabled: true,
        auction_enabled: true,
      };
    }
  },

  // Update global feature flag
  // {string} featureName - Feature name
  // {boolean} isEnabled - Enable/disable
  // {string} reason - Reason for change (optional)
  // returns {Promise<Object>}
  async updateGlobalFlag(featureName, isEnabled, reason = null) {
    try {
      // Validate: if disabled, reason is required
      if (!isEnabled && (!reason || reason.trim() === "")) {
        throw new Error("Alasan penonaktifan harus diisi");
      }

      // Validate: if disabled, reason must be at least 20 characters
      if (!isEnabled && reason.trim().length < 20) {
        throw new Error("Alasan penonaktifan global flags harus minimal 20 karakter");
      }

      // Sanitize reason
      const sanitizedReason = reason 
        ? reason
            .trim()
            .replace(/<[^>]*>/g, '')
            .replace(/[<>"']/g, '')
            .substring(0, 500)
        : null;

      // Delete all user-specific entries for this feature to allow global override
      const deleteQuery = `
        DELETE FROM user_feature_access 
        WHERE feature_name = $1 AND user_id IS NOT NULL
      `;
      const deleteResult = await db.query(deleteQuery, [featureName]);
      console.log(
        `[Global Flag Update] Deleted ${deleteResult.rowCount} user-specific entries for ${featureName}`
      );

      // Update global flag
      const query = `
        INSERT INTO user_feature_access (user_id, feature_name, is_enabled, reason, updated_at)
        VALUES (NULL, $1, $2, $3, NOW())
        ON CONFLICT (user_id, feature_name) 
        DO UPDATE SET 
          is_enabled = EXCLUDED.is_enabled,
          reason = EXCLUDED.reason,
          updated_at = NOW()
        RETURNING *
      `;
      const result = await db.query(query, [
        featureName,
        isEnabled,
        sanitizedReason,
      ]);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating global flag:", error);
      throw error;
    }
  },

  // Update user-specific feature flag
  // {number} userId - User ID
  // {string} featureName - Feature name
  // {boolean} isEnabled - Enable/disable
  // {string} reason - Reason for change
  async updateUserFlag(userId, featureName, isEnabled, reason = null) {
    try {
      // Validate: if disabled, reason is required
      if (!isEnabled && (!reason || reason.trim() === "")) {
        throw new Error("Alasan penonaktifan harus diisi");
      }

      // Validate: if disabled, reason must be at least 10 characters
      if (!isEnabled && reason.trim().length < 10) {
        throw new Error("Alasan penonaktifan harus minimal 10 karakter");
      }

      // Sanitize reason: trim, remove HTML tags, and limit length
      const sanitizedReason = reason 
        ? reason
            .trim()
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/[<>"']/g, '') // Remove dangerous characters
            .substring(0, 500)
        : null;

      const query = `
        INSERT INTO user_feature_access (user_id, feature_name, is_enabled, reason, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id, feature_name)
        DO UPDATE SET 
          is_enabled = EXCLUDED.is_enabled,
          reason = EXCLUDED.reason,
          updated_at = NOW()
        RETURNING *
      `;
      const result = await db.query(query, [
        userId,
        featureName,
        isEnabled,
        sanitizedReason,
      ]);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating user flag:", error);
      throw error;
    }
  },

  // Get user restrictions with reasons
  async getUserRestrictions(userId) {
    try {
      const query = `
        SELECT feature_name, is_enabled, reason, updated_at
        FROM user_feature_access 
        WHERE user_id = $1 AND is_enabled = FALSE
      `;
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error("Error getting user restrictions:", error);
      return [];
    }
  },

  // Get global restrictions with reasons
  async getGlobalRestrictions() {
    try {
      const query = `
        SELECT feature_name, is_enabled, reason, updated_at
        FROM user_feature_access 
        WHERE user_id IS NULL AND is_enabled = FALSE
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error("Error getting global restrictions:", error);
      return [];
    }
  },
};
