import webpush from "../config/vapid.js";

let subscriptions = [];

export const WebPushService = {
  getAll() {
    return subscriptions;
  },

  addSubscription(sub) {
    const exists = subscriptions.find((s) => s.endpoint === sub.endpoint);

    if (exists) return { status: "already_subscribed", subscription: exists };

    subscriptions.push(sub);
    return { status: "subscribed", subscription: sub };
  },

  async sendNotification(payload) {
    const results = await Promise.all(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub, JSON.stringify(payload)).catch((err) => {
          console.error("Push error:", err.statusCode);

          // Hapus subscription expired (410 Gone)
          if (err.statusCode === 410) {
            subscriptions = subscriptions.filter(
              (s) => s.endpoint !== sub.endpoint
            );
            console.log("Removed expired subscription:", sub.endpoint);
          }

          return null; // jangan reject semua
        })
      )
    );

    const successCount = results.filter((r) => r !== null).length;
    return { success: successCount };
  },
};
