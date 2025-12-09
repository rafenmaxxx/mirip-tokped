import { AuctionBidsService } from "../service/s_auctionbids.js";

export const AuctionBidsController = {
    async getByAuctionId(req, res) {
        const auctionId = req.params.auctionId;
        const bids = await AuctionBidsService.getByAuctionId(auctionId);
        res.json(bids);
    },

    async placeBid(req, res) {
        try {
            const auctionId = req.params.auctionId;
            const { user_id, amount } = req.body;
            
            const result = await AuctionBidsService.placeBid(auctionId, user_id, amount);
            
            res.json(result);
        } catch (error) {
            console.error("Error in placeBid controller:", error);
            res.status(400).json({ message: error.message });
        }
    },
};