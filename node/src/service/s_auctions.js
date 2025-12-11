import db from "../config/db.js";

export const AuctionsService = {
  async updateAuctionStatusByTime(auctionId) {
    await db.query(
      `UPDATE auctions
       SET status_auction = CASE
         WHEN status_auction = 'scheduled' AND NOW() >= start_time AND NOW() < end_time THEN 'active'
         WHEN status_auction IN ('scheduled', 'active') AND NOW() >= end_time THEN 'ended'
         ELSE status_auction
       END
       WHERE auction_id = $1 AND status_auction NOT IN ('cancelled', 'ended')`,
      [auctionId]
    );
  },

  async getAll() {
    await db.query(
      `UPDATE auctions
       SET status_auction = CASE
         WHEN status_auction = 'scheduled' AND NOW() >= start_time AND NOW() < end_time THEN 'active'
         WHEN status_auction IN ('scheduled', 'active') AND NOW() >= end_time THEN 'ended'
         ELSE status_auction
       END
       WHERE status_auction NOT IN ('cancelled', 'ended')`
    );

    const res =
      await db.query(`SELECT a.auction_id, p.product_name, p.main_image_path, a.quantity, s.store_name, a.starting_price, a.current_price, a.start_time, a.end_time, COUNT(ab.bid_id) AS bidders_amount, a.status_auction
                                FROM auctions a
                                JOIN products p ON a.product_id = p.product_id
                                JOIN stores s ON p.store_id = s.store_id
                                LEFT JOIN auction_bids ab ON a.auction_id = ab.auction_id
                                GROUP BY a.auction_id,
                                        p.product_name,
                                        p.main_image_path,
                                        a.quantity,
                                        s.store_name,
                                        a.starting_price,
                                        a.current_price,
                                        a.start_time,
                                        a.end_time,
                                        a.status_auction
                                ORDER BY a.auction_id DESC;
                             `);
    return res.rows;
  },

  async getById(id) {
    await this.updateAuctionStatusByTime(id);

    const res = await db.query(
      `SELECT 
        p.product_name, 
        p.main_image_path, 
        p.description AS product_description, 
        a.quantity, 
        s.store_name,
        s.store_id,
        s.user_id AS seller_id, 
        a.starting_price, 
        a.current_price, 
        a.min_increment, 
        a.start_time, 
        a.end_time, 
        a.status_auction,
        a.winner_id,
        COUNT(ab.bid_id) AS bid_amount
      FROM auctions a
      JOIN products p ON a.product_id = p.product_id
      JOIN stores s ON p.store_id = s.store_id
      LEFT JOIN auction_bids ab ON a.auction_id = ab.auction_id
      WHERE a.auction_id = $1
      GROUP BY 
        p.product_name, 
        p.main_image_path,
        p.description,
        a.quantity, 
        s.store_name,
        s.store_id,
        s.user_id,
        a.starting_price,
        a.current_price,
        a.min_increment,
        a.start_time,
        a.end_time,
        a.status_auction,
        a.winner_id
      `,
      [id]
    );
    return res.rows[0];
  },

  async create(data) {
    const {
      product_id,
      starting_price,
      min_increment,
      quantity,
      start_time,
      end_time,
    } = data;
    const res = await db.query(
      `INSERT INTO auctions (product_id, starting_price, min_increment, quantity, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        product_id,
        starting_price,
        min_increment,
        quantity,
        start_time,
        end_time,
      ]
    );
    return res.rows[0];
  },

  async remove(id) {
    await db.query("DELETE FROM auctions WHERE auction_id = $1", [id]);
    return { message: "Auction deleted" };
  },

  async broadcastAuctionUpdate(io, auctionId, updateData) {
    const roomName = `auction-room-${auctionId}`;

    io.to(roomName).emit("auction_updated", {
      auctionId,
      ...updateData,
      timestamp: new Date().toISOString(),
    });
  },

  async stop(id, io = null) {
    try {
      const auctionRes = await db.query(
        `SELECT a.*, p.store_id, p.product_name
       FROM auctions a
       JOIN products p ON a.product_id = p.product_id
       WHERE a.auction_id = $1`,
        [id]
      );

      if (auctionRes.rows.length === 0) {
        throw new Error("Auction not found");
      }

      const auction = auctionRes.rows[0];

      // 🚨 JIKA SUDAH ENDED — STOP DISINI
      if (auction.status_auction === "ended") {
        return auction; // tidak proses ulang
      }

      const bidRes = await db.query(
        `SELECT bidder_id, bid_amount
       FROM auction_bids
       WHERE auction_id = $1
       ORDER BY bid_amount DESC
       LIMIT 1`,
        [id]
      );

      let winnerId = null;
      let finalPrice = auction.current_price;

      if (bidRes.rows.length > 0) {
        const winner = bidRes.rows[0];
        winnerId = winner.bidder_id;
        finalPrice = winner.bid_amount;

        const userRes = await db.query(
          `SELECT address FROM users WHERE user_id = $1`,
          [winnerId]
        );

        const shippingAddress =
          userRes.rows[0]?.address || "Alamat belum diset";

        const orderRes = await db.query(
          `INSERT INTO orders (buyer_id, store_id, total_price, shipping_address, status)
         VALUES ($1, $2, $3, $4, 'approved')
         RETURNING order_id`,
          [winnerId, auction.store_id, finalPrice, shippingAddress]
        );

        const orderId = orderRes.rows[0].order_id;

        await db.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price_at_order, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
          [
            orderId,
            auction.product_id,
            auction.quantity,
            finalPrice,
            finalPrice,
          ]
        );
      }

      const updateRes = await db.query(
        `UPDATE auctions 
       SET status_auction = 'ended', end_time = NOW(), winner_id = $2
       WHERE auction_id = $1 
       RETURNING *`,
        [id, winnerId]
      );

      // BROADCAST SOCKET EVENT
      if (io) {
        const roomName = `auction-room-${id}`;
        io.to(roomName).emit("auction_ended", {
          auctionId: id,
          winnerId,
          finalPrice,
          timestamp: new Date().toISOString(),
        });
      }

      return updateRes.rows[0];
    } catch (error) {
      console.error("Stop Auction Error:", error);
      throw error; // lempar ke controller
    }
  },
};
