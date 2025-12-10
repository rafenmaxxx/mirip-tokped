import db from "../config/db.js";

export const AuctionBidsService = {
    async getByAuctionId(auctionId) {
        const res = await db.query(
            `SELECT ab.bid_id, ab.auction_id, ab.bidder_id, u.name as bidder_name, ab.bid_amount as amount, ab.bid_time as created_at
             FROM auction_bids ab
             JOIN users u ON ab.bidder_id = u.user_id
             WHERE ab.auction_id = $1
             ORDER BY ab.bid_time DESC`,
            [auctionId]
        );
        return res.rows;
    },

    async placeBid(auctionId, userId, bidAmount) {

        const previousBidQuery = await db.query(
            `SELECT bidder_id, bid_amount 
             FROM auction_bids 
             WHERE auction_id = $1 
             ORDER BY bid_time DESC 
             LIMIT 1`,
            [auctionId]
        );
        
        if (previousBidQuery.rows.length > 0) {
            const previousBidder = previousBidQuery.rows[0];
            await db.query(
                `UPDATE users 
                 SET balance = balance + $1 
                 WHERE user_id = $2`,
                [previousBidder.bid_amount, previousBidder.bidder_id]
            );
        }

        await db.query(
            `UPDATE users 
             SET balance = balance - $1 
             WHERE user_id = $2`,
            [bidAmount, userId]
        );
        
        const result = await db.query(
            `INSERT INTO auction_bids (auction_id, bidder_id, bid_amount, bid_time)
             VALUES ($1, $2, $3, NOW())
             RETURNING bid_id`,
            [auctionId, userId, bidAmount]
        );
        
        await db.query(
            `UPDATE auctions 
             SET current_price = $1
             WHERE auction_id = $2`,
            [bidAmount, auctionId]
        );
        
        return { 
            bidId: result.rows[0].bid_id,
            message: 'Bid placed successfully'
        };
    },
};