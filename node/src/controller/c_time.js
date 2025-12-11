import { TimeService } from "../service/s_time.js";

export const TimeController = {
  async getTime(req, res) {
    try {
      const time = await TimeService.getTime();

      res.json({
        success: true,
        data: time,
        message: "Server time retrieved successfully",
      });
    } catch (error) {
      console.error("[TimeController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get server time",
        error: error.message,
      });
    }
  },
};
