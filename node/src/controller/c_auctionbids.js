import { AuctionBidsService } from "../service/s_auctionbids.js";
import { UserService } from "../service/s_user.js";
export const AuctionBidsController = {
  async getByAuctionId(req, res) {
    const auctionId = req.params.auctionId;
    const bids = await AuctionBidsService.getByAuctionId(auctionId);
    res.json(bids);
  },

  async placeBid(req, res) {
    try {
      const auctionId = req.params.auctionId;
      const { amount } = req.body;

      // Ambil userId dari session
      const user = await UserService.getMe(req.cookies.PHPSESSID);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const userId = user.user_id;

      const result = await AuctionBidsService.placeBid(
        auctionId,
        userId,
        amount
      );

      // Emit bid ke room
      const io = req.app.get("io");
      if (io) {
        const room = `auction-room-${auctionId}`;
        io.to(room).emit("new_bid", result.bidData);
      }

      res.json(result);
    } catch (error) {
      console.error("Error in placeBid controller:", error);
      res.status(400).json({ message: error.message });
    }
  },
};
