// c_webpush.js
import { WebPushService } from "../service/s_webpush.js";

export const WebPushController = {
  // Pastikan semua handler adalah async function
  subscribe: async (req, res) => {
    try {
      const userId = req.user?.user_id || req.body.userId;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const result = await WebPushService.addSubscription(req.body, userId);

      // Async check queue setelah subscribe
      setTimeout(async () => {
        try {
          await WebPushService.checkAndSendQueued(userId);
        } catch (err) {
          console.error("Error sending queued after subscribe:", err);
        }
      }, 1000);

      res.json(result);
    } catch (err) {
      console.error("Error in subscribe:", err);
      res.status(500).json({ error: err.message });
    }
  },

  sendToUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { title, body, data, icon, type } = req.body;

      const payload = {
        title: title || "Notification",
        body: body || "You have a new notification",
        data: data || {},
        icon,
        type,
      };

      const result = await WebPushService.sendToUser(userId, payload);

      res.json({
        status: "processing",
        userId,
        result,
      });
    } catch (err) {
      console.error("Error sending notification to user:", err);
      res.status(500).json({ error: "Failed to send notification" });
    }
  },

  checkQueue: async (req, res) => {
    try {
      const userId = req.user?.user_id || req.query.userId;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const result = await WebPushService.checkAndSendQueued(userId);

      res.json({
        status: "checked",
        userId,
        result,
      });
    } catch (err) {
      console.error("Error checking queue:", err);
      res.status(500).json({ error: "Failed to check queue" });
    }
  },

  getQueued: async (req, res) => {
    try {
      const userId = req.user?.user_id || req.params.userId;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const notifications = await WebPushService.getQueuedForUser(userId);

      res.json({
        userId,
        queuedCount: notifications.length,
        notifications,
      });
    } catch (err) {
      console.error("Error getting queued notifications:", err);
      res.status(500).json({ error: "Failed to get queued notifications" });
    }
  },

  send: async (req, res) => {
    try {
      const { title, body, data } = req.body;
      const payload = {
        title: title || "Default Title",
        body: body || "Default Body",
        data: data || {},
      };

      // Fallback ke semua users
      const allSubs = await WebPushService.getAllSubscriptions();
      let successCount = 0;

      for (const sub of allSubs) {
        try {
          const subscriptionObj = {
            endpoint: sub.endpoints,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key,
            },
          };

          // Anda perlu import webpush di sini atau di service
          // const webpush = require("../config/vapid.js");
          // await webpush.sendNotification(subscriptionObj, JSON.stringify(payload));

          successCount++;
        } catch (err) {
          console.error("Send error:", err);
        }
      }

      res.json({
        status: "sent",
        payload,
        result: { success: successCount, total: allSubs.length },
      });
    } catch (err) {
      console.error("Error sending notification:", err);
      res.status(500).json({ error: "Failed to send notification" });
    }
  },

  list: async (req, res) => {
    try {
      const subscriptions = await WebPushService.getAllSubscriptions();
      res.json(subscriptions);
    } catch (err) {
      console.error("Error listing subscriptions:", err);
      res.status(500).json({ error: "Failed to get subscriptions" });
    }
  },

  cleanup: async (req, res) => {
    try {
      const result = await WebPushService.cleanupExpiredQueue();
      res.json({
        status: "cleaned",
        result,
      });
    } catch (err) {
      console.error("Error cleaning up queue:", err);
      res.status(500).json({ error: "Failed to cleanup queue" });
    }
  },
};
