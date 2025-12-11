import db from "../config/db.js";

export const TimeService = {
  async getTime() {
    try {
      const result = await db.query(
        "SELECT NOW() as now, EXTRACT(EPOCH FROM NOW()) as timestamp"
      );

      const dbTime = result.rows[0];

      return {
        now: dbTime.now,
        timestamp: parseInt(dbTime.timestamp),
        iso: dbTime.now.toISOString(),
        formatted: dbTime.now.toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
        }),
      };
    } catch (error) {
      console.error("[TimeService] Error:", error);

      // Fallback ke server time
      const now = new Date();
      return {
        now: now,
        timestamp: Math.floor(now.getTime() / 1000),
        iso: now.toISOString(),
        formatted: now.toLocaleString("id-ID"),
      };
    }
  },
};
