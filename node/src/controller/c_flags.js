import { FlagsService } from "../service/s_flags.js";

export const FlagsController = {
  // GET /node/api/flags/global
  // Get all global feature flags
  async getGlobalFlags(req, res, next) {
    try {
      const flags = await FlagsService.getAllGlobalFlags();

      return res.status(200).json({
        status: "success",
        message: "Berhasil mendapatkan global flags",
        data: flags,
      });
    } catch (error) {
      console.error("Get global flags error:", error);
      next(error);
    }
  },

  // GET /node/api/flags/user/:userId
  // Get feature flags for specific user (includes global + user overrides)
  async getUserFlags(req, res, next) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "User ID diperlukan",
        });
      }

      const flags = await FlagsService.getUserFlags(userId);

      return res.status(200).json({
        status: "success",
        message: "Berhasil mendapatkan user flags",
        data: flags,
      });
    } catch (error) {
      console.error("Get user flags error:", error);
      next(error);
    }
  },

  // GET /node/api/flags/check
  // Check if specific feature is enabled for user
  // params: userId (optional), featureName (required)
  async checkFeature(req, res, next) {
    try {
      const { userId, featureName } = req.query;

      if (!featureName) {
        return res.status(400).json({
          status: "error",
          message: "Feature name diperlukan",
        });
      }

      let isEnabled;

      if (userId) {
        isEnabled = await FlagsService.isUserFeatureEnabled(
          parseInt(userId),
          featureName
        );
      } else {
        isEnabled = await FlagsService.isGlobalFeatureEnabled(featureName);
      }

      return res.status(200).json({
        status: "success",
        data: {
          featureName,
          userId: userId ? parseInt(userId) : null,
          isEnabled,
        },
      });
    } catch (error) {
      console.error("Check feature error:", error);
      next(error);
    }
  },

  // PUT /node/api/flags/global
  // Update global feature flag
  // Body: { featureName, isEnabled, reason }
  async updateGlobalFlag(req, res, next) {
    try {
      const { featureName, isEnabled, reason } = req.body;

      if (!featureName || isEnabled === undefined) {
        return res.status(400).json({
          status: "error",
          message: "Feature name dan isEnabled diperlukan",
        });
      }

      const validFeatures = [
        "checkout_enabled",
        "chat_enabled",
        "auction_enabled",
      ];
      if (!validFeatures.includes(featureName)) {
        return res.status(400).json({
          status: "error",
          message: "Feature name tidak valid",
        });
      }

      const result = await FlagsService.updateGlobalFlag(
        featureName,
        isEnabled,
        reason
      );

      return res.status(200).json({
        status: "success",
        message: "Global flag berhasil diupdate",
        data: result,
      });
    } catch (error) {
      console.error("Update global flag error:", error);
      next(error);
    }
  },

  // PUT /node/api/flags/user/:userId
  // Update user-specific feature flag
  // Body: { featureName, isEnabled, reason }
  async updateUserFlag(req, res, next) {
    try {
      const userId = parseInt(req.params.userId);
      const { featureName, isEnabled, reason } = req.body;

      if (!userId || !featureName || isEnabled === undefined) {
        return res.status(400).json({
          status: "error",
          message: "User ID, feature name, dan isEnabled diperlukan",
        });
      }

      const validFeatures = [
        "checkout_enabled",
        "chat_enabled",
        "auction_enabled",
      ];
      if (!validFeatures.includes(featureName)) {
        return res.status(400).json({
          status: "error",
          message: "Feature name tidak valid",
        });
      }

      const result = await FlagsService.updateUserFlag(
        userId,
        featureName,
        isEnabled,
        reason
      );

      return res.status(200).json({
        status: "success",
        message: "User flag berhasil diupdate",
        data: result,
      });
    } catch (error) {
      console.error("Update user flag error:", error);
      next(error);
    }
  },

  // GET /node/api/flags/restrictions/:userId
  // Get all restrictions for specific user
  async getUserRestrictions(req, res, next) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "User ID diperlukan",
        });
      }

      const restrictions = await FlagsService.getUserRestrictions(userId);

      return res.status(200).json({
        status: "success",
        message: "Berhasil mendapatkan user restrictions",
        data: restrictions,
      });
    } catch (error) {
      console.error("Get user restrictions error:", error);
      next(error);
    }
  },

  // GET /node/api/flags/restrictions/global
  // Get all global restrictions
  async getGlobalRestrictions(req, res, next) {
    try {
      const restrictions = await FlagsService.getGlobalRestrictions();

      return res.status(200).json({
        status: "success",
        message: "Berhasil mendapatkan global restrictions",
        data: restrictions,
      });
    } catch (error) {
      console.error("Get global restrictions error:", error);
      next(error);
    }
  },

  async checkAuctionPermission(req, res, next) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "User ID diperlukan",
        });
      }

      const result = await FlagsService.isAllowedAuction(userId);

      return res.status(200).json({
        status: "success",
        data: {
          userId,
          feature: "auction",
          isAllowed: result.isAllowed,
          reason: result.reason,
        },
      });
    } catch (error) {
      console.error("Check auction permission error:", error);
      next(error);
    }
  },

  async checkChatPermission(req, res, next) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "User ID diperlukan",
        });
      }

      const result = await FlagsService.isAllowedChat(userId);

      return res.status(200).json({
        status: "success",
        data: {
          userId,
          feature: "chat",
          isAllowed: result.isAllowed,
          reason: result.reason,
        },
      });
    } catch (error) {
      console.error("Check chat permission error:", error);
      next(error);
    }
  },

  async checkCheckoutPermission(req, res, next) {
    try {
      const userId = parseInt(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          status: "error",
          message: "User ID diperlukan",
        });
      }

      const result = await FlagsService.isAllowedCheckout(userId);

      return res.status(200).json({
        status: "success",
        data: {
          userId,
          feature: "checkout",
          isAllowed: result.isAllowed,
          reason: result.reason,
        },
      });
    } catch (error) {
      console.error("Check checkout permission error:", error);
      next(error);
    }
  },
};
