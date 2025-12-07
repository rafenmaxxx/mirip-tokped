import { WebPushService } from "../service/s_webpush.js";

export const WebPushController = {
  subscribe(req, res) {
    const result = WebPushService.addSubscription(req.body);
    res.json(result);
  },

  async send(req, res) {
    try {
      const { title, body, data } = req.body;
      const payload = {
        title: title || "Default Title",
        body: body || "Default Body",
        data: data || {},
      };

      const result = await WebPushService.sendNotification(payload);

      res.json({
        status: "sent",
        payload,
        result,
      });
    } catch (err) {
      console.error("Error sending notification:", err);
      res.status(500).json({ error: "Failed to send notification" });
    }
  },

  list(req, res) {
    res.json(WebPushService.getAll());
  },
};
