import webpush from "../config/vapid.js";
import redis from "../config/redis.js";
import db from "../config/db.js";

const REDIS_QUEUE_KEY = "push:queue";
const REDIS_PENDING_KEY = "push:pending"; // Untuk notifikasi yang sedang diproses
const REDIS_SUBSCRIPTION_KEY = "push:subscriptions";

export const WebPushService = {
  // ========== SUBSCRIPTION MANAGEMENT (SAMA) ==========
  async getAllSubscriptions() {
    try {
      const result = await db.query(
        `SELECT ps.*, u.email, u.name, u.role 
         FROM push_subscriptions ps
         JOIN users u ON ps.user_id = u.user_id
        `
      );
      return result.rows;
    } catch (err) {
      console.error("Error getting subscriptions:", err);
      return [];
    }
  },

  async getSubscriptionsByUser(userId) {
    try {
      // Coba ambil dari Redis cache
      const cached = await redis.get(`${REDIS_SUBSCRIPTION_KEY}:${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      const result = await db.query(
        `SELECT * FROM push_subscriptions 
         WHERE user_id = $1`,
        [userId]
      );

      // Cache di Redis
      await redis.setEx(
        `${REDIS_SUBSCRIPTION_KEY}:${userId}`,
        300,
        JSON.stringify(result.rows)
      );

      return result.rows;
    } catch (err) {
      console.error("Error getting user subscriptions:", err);
      return [];
    }
  },

  async addSubscription(sub, userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const userCheck = await db.query(
        "SELECT user_id FROM users WHERE user_id = $1 ",
        [userId]
      );

      if (userCheck.rows.length === 0) {
        throw new Error(`User with ID ${userId} not found`);
      }

      const existing = await db.query(
        `SELECT subscription_id FROM push_subscriptions 
         WHERE endpoints = $1`,
        [sub.endpoint]
      );

      let subscriptionId;

      if (existing.rows.length > 0) {
        await db.query(
          `UPDATE push_subscriptions 
           SET user_id = $1, updated_at = NOW()
           WHERE endpoints = $2`,
          [userId, sub.endpoint]
        );
        subscriptionId = existing.rows[0].subscription_id;
      } else {
        const result = await db.query(
          `INSERT INTO push_subscriptions 
           (user_id, endpoints, p256dh_key, auth_key, created_at)
           VALUES ($1, $2, $3, $4, NOW())
           RETURNING subscription_id`,
          [userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
        );
        subscriptionId = result.rows[0].subscription_id;
      }

      // Clear cache
      await redis.del(`${REDIS_SUBSCRIPTION_KEY}:${userId}`);

      return {
        status: existing.rows.length > 0 ? "updated" : "subscribed",
        subscription: sub,
        userId: userId,
        subscriptionId: subscriptionId,
      };
    } catch (err) {
      console.error("Error adding subscription:", err);
      throw err;
    }
  },

  // ========== SEND TO USER (WITH QUEUE SUPPORT) ==========
  async sendToUser(userId, payload) {
    try {
      const notificationPayload = {
        title: payload.title || "Notification",
        body: payload.body || "You have a new notification",
        icon: payload.icon || "/vite.svg",
        data: payload.data || {},
        _meta: {
          userId,
          sentAt: new Date().toISOString(),
          type: payload.type || "general",
          notificationId: `notif_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        },
      };

      const subscriptions = await this.getSubscriptionsByUser(userId);

      if (subscriptions.length === 0) {
        await this.queueNotification(userId, notificationPayload);
        return {
          success: 0,
          queued: 1,
          message: "User not subscribed, notification queued",
        };
      }

      let successCount = 0;
      let expiredCount = 0;
      let anyFailed = false;

      for (const sub of subscriptions) {
        try {
          // Pastikan keys ada dalam format yang benar
          const subscriptionObj = {
            endpoint: sub.endpoints,
            keys: {
              p256dh: sub.p256dh_key || sub.keys?.p256dh,
              auth: sub.auth_key || sub.keys?.auth,
            },
          };

          // Validasi keys
          if (!subscriptionObj.keys.p256dh || !subscriptionObj.keys.auth) {
            console.error(
              `Invalid subscription keys for endpoint: ${sub.endpoints}`
            );
            anyFailed = true;
            continue;
          }

          await webpush.sendNotification(
            subscriptionObj,
            JSON.stringify(notificationPayload),
            {
              TTL: 24 * 60 * 60,
              urgency: "normal",
            }
          );

          successCount++;
        } catch (err) {
          console.error(`Push error:`, err.statusCode);

          if (err.statusCode === 410) {
            await this.removeExpiredSubscription(sub.endpoints);
            expiredCount++;
            anyFailed = true;
          } else {
            anyFailed = true;
          }
        }
      }

      if (anyFailed && successCount === 0) {
        await this.queueNotification(userId, notificationPayload);
      }

      return {
        success: successCount,
        expired: expiredCount,
        queued: anyFailed && successCount === 0 ? 1 : 0,
        totalSubscriptions: subscriptions.length,
        userId,
      };
    } catch (err) {
      console.error("Error in sendToUser:", err);

      await this.queueNotification(userId, {
        ...payload,
        _meta: {
          userId,
          error: err.message,
          queuedAt: new Date().toISOString(),
          notificationId: `notif_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        },
      });

      throw err;
    }
  },

  // ========== SIMPLE QUEUE SYSTEM ==========
  async queueNotification(userId, payload) {
    try {
      const notificationData = {
        userId,
        payload,
        queuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Simpan ke Redis set dengan score = timestamp
      await redis.zAdd(REDIS_QUEUE_KEY, {
        score: Date.now(),
        value: JSON.stringify(notificationData),
      });

      console.log(`Notification queued for user ${userId}`);
      return { queued: true, userId };
    } catch (err) {
      console.error("Error queueing notification:", err);
      throw err;
    }
  },

  // ========== CHECK AND SEND QUEUED NOTIFICATIONS ==========
  // Dipanggil dari API endpoint yang bisa di-trigger oleh client
  async checkAndSendQueued(userId = null) {
    try {
      console.log("Checking queued notifications...");

      // Ambil notifikasi dari queue (yang belum expired)
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

      // Get notifications from last week
      const notifications = await redis.zRangeByScore(
        REDIS_QUEUE_KEY,
        weekAgo,
        now
      );

      if (notifications.length === 0) {
        return { processed: 0, message: "No queued notifications" };
      }

      let processed = 0;
      let failed = 0;

      for (const notificationStr of notifications) {
        try {
          const notification = JSON.parse(notificationStr);

          // Filter by userId jika ada
          if (userId && notification.userId !== userId) {
            continue;
          }

          // Cek expiration
          if (new Date(notification.expiresAt) < new Date()) {
            // Remove expired
            await redis.zRem(REDIS_QUEUE_KEY, notificationStr);
            continue;
          }

          // Coba kirim
          const subscriptions = await this.getSubscriptionsByUser(
            notification.userId
          );

          if (subscriptions.length > 0) {
            // Ada subscription, coba kirim
            let sent = false;

            for (const sub of subscriptions) {
              try {
                const subscriptionObj = {
                  endpoint: sub.endpoints,
                  keys: {
                    p256dh: sub.p256dh_key,
                    auth: sub.auth_key,
                  },
                };

                await webpush.sendNotification(
                  subscriptionObj,
                  JSON.stringify(notification.payload),
                  { TTL: 3600 } // 1 hour
                );

                sent = true;
                break; // Berhasil dikirim ke salah satu device
              } catch (err) {
                // Lanjut ke device berikutnya
                continue;
              }
            }

            if (sent) {
              // Hapus dari queue jika berhasil
              await redis.zRem(REDIS_QUEUE_KEY, notificationStr);
              processed++;
            } else {
              failed++;
            }
          } else {
            // Masih belum ada subscription, biarkan di queue
            failed++;
          }
        } catch (parseErr) {
          console.error("Error processing queued notification:", parseErr);
          // Hapus invalid notification
          await redis.zRem(REDIS_QUEUE_KEY, notificationStr);
        }
      }

      return {
        processed,
        failed,
        total: notifications.length,
      };
    } catch (err) {
      console.error("Error checking queue:", err);
      throw err;
    }
  },

  // ========== GET QUEUED NOTIFICATIONS FOR USER ==========
  async getQueuedForUser(userId) {
    try {
      const allNotifications = await redis.zRange(REDIS_QUEUE_KEY, 0, -1);

      const userNotifications = [];
      for (const notificationStr of allNotifications) {
        try {
          const notification = JSON.parse(notificationStr);
          if (notification.userId == userId) {
            userNotifications.push(notification);
          }
        } catch (e) {
          // Skip invalid
        }
      }

      return userNotifications;
    } catch (err) {
      console.error("Error getting queued notifications:", err);
      return [];
    }
  },

  // ========== REMOVE EXPIRED ==========
  async removeExpiredSubscription(endpoint) {
    try {
      await db.query("DELETE FROM push_subscriptions WHERE endpoints = $1", [
        endpoint,
      ]);

      // Find and clear user cache
      const userResult = await db.query(
        "SELECT user_id FROM push_subscriptions WHERE endpoints = $1",
        [endpoint]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].user_id;
        await redis.del(`${REDIS_SUBSCRIPTION_KEY}:${userId}`);
      }

      return { status: "removed", endpoint };
    } catch (err) {
      console.error("Error removing expired subscription:", err);
      throw err;
    }
  },

  // ========== CLEANUP EXPIRED QUEUE ITEMS ==========
  async cleanupExpiredQueue() {
    try {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      // Remove items older than 7 days
      const removed = await redis.zRemRangeByScore(REDIS_QUEUE_KEY, 0, weekAgo);

      return { removed };
    } catch (err) {
      console.error("Error cleaning up queue:", err);
      throw err;
    }
  },
};
