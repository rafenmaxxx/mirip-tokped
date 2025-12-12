import db from "../config/db.js";

export const AuctionsService = {
  async updateAuctionStatusByTime(auctionId) {
    const auctionRes = await db.query(
      `SELECT a.auction_id, a.status_auction, a.start_time, a.end_time, p.store_id
       FROM auctions a
       JOIN products p ON a.product_id = p.product_id
       WHERE a.auction_id = $1`,
      [auctionId]
    );

    if (auctionRes.rows.length === 0) {
      return;
    }

    const auction = auctionRes.rows[0];
    const storeId = auction.store_id;

    await db.query(
      `UPDATE auctions a
       SET status_auction = 'ended'
       FROM products p
       WHERE a.product_id = p.product_id
         AND p.store_id = $1
         AND a.status_auction IN ('scheduled', 'active')
         AND a.winner_id IS NOT NULL`,
      [storeId]
    );

    const activeAuctionRes = await db.query(
      `SELECT a.auction_id
       FROM auctions a
       JOIN products p ON a.product_id = p.product_id
       WHERE p.store_id = $1
         AND a.status_auction = 'active'
         AND NOW() < a.end_time
       LIMIT 1`,
      [storeId]
    );

    if (activeAuctionRes.rows.length === 0) {
      await db.query(
        `UPDATE auctions a
         SET status_auction = 'active'
         FROM products p
         WHERE a.product_id = p.product_id
           AND p.store_id = $1
           AND a.status_auction = 'scheduled'
           AND NOW() >= a.start_time
           AND NOW() < a.end_time
           AND a.auction_id = (
             SELECT a2.auction_id
             FROM auctions a2
             JOIN products p2 ON a2.product_id = p2.product_id
             WHERE p2.store_id = $1
               AND a2.status_auction = 'scheduled'
               AND NOW() >= a2.start_time
               AND NOW() < a2.end_time
             ORDER BY a2.start_time ASC
             LIMIT 1
           )`,
        [storeId]
      );
    }
  },

  async getAll() {
    const storesRes = await db.query(
      `SELECT DISTINCT p.store_id, a.auction_id
       FROM auctions a
       JOIN products p ON a.product_id = p.product_id
       WHERE a.status_auction NOT IN ('cancelled', 'ended')
       LIMIT 1`
    );

    for (const store of storesRes.rows) {
      await this.updateAuctionStatusByTime(store.auction_id);
    }

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

  async getByStoreId(storeId) {
    const anyAuctionRes = await db.query(
      `SELECT a.auction_id
       FROM auctions a
       JOIN products p ON a.product_id = p.product_id
       WHERE p.store_id = $1
       LIMIT 1`,
      [storeId]
    );

    if (anyAuctionRes.rows.length > 0) {
      await this.updateAuctionStatusByTime(anyAuctionRes.rows[0].auction_id);
    }

    const res = await db.query(
      `SELECT 
        a.auction_id,
        a.product_id,
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
        a.created_at,
        COUNT(ab.bid_id) AS bid_amount
      FROM auctions a
      JOIN products p ON a.product_id = p.product_id
      JOIN stores s ON p.store_id = s.store_id
      LEFT JOIN auction_bids ab ON a.auction_id = ab.auction_id
      WHERE s.store_id = $1
      GROUP BY 
        a.auction_id,
        a.product_id,
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
        a.winner_id,
        a.created_at
      ORDER BY a.created_at DESC
      `,
      [storeId]
    );
    return res.rows;
  },

  async create(data) {
    const {
      product_id,
      starting_price,
      current_price,
      min_increment,
      quantity,
      start_time,
      end_time,
    } = data;

    const productRes = await db.query(
      `SELECT stock FROM products WHERE product_id = $1`,
      [product_id]
    );

    if (productRes.rows.length === 0) {
      throw new Error("Product not found");
    }

    const currentStock = productRes.rows[0].stock;
    if (currentStock < quantity) {
      throw new Error("Insufficient stock");
    }

    await db.query(
      `UPDATE products SET stock = stock - $1 WHERE product_id = $2`,
      [quantity, product_id]
    );

    const startTimeDate = new Date(start_time);
    const endTimeDate = new Date(end_time);

    if (isNaN(startTimeDate.getTime()) || isNaN(endTimeDate.getTime())) {
      throw new Error("Invalid date format");
    }

    const res = await db.query(
      `INSERT INTO auctions (product_id, starting_price, current_price, min_increment, quantity, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        product_id,
        parseFloat(starting_price),
        parseFloat(current_price),
        parseFloat(min_increment),
        parseInt(quantity),
        startTimeDate.toISOString(),
        endTimeDate.toISOString(),
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

      if (auction.status_auction === "ended") {
        return auction;
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

      console.log("[BC] EMIT AUCTION END");
      if (io) {
        const roomName = `auction-room-${id}`;
        io.to(roomName).emit("auction_ended", {
          auctionId: id,
          winnerId,
          finalPrice,
          timestamp: new Date().toISOString(),
        });
      }

      await this.updateAuctionStatusByTime(id);

      return updateRes.rows[0];
    } catch (error) {
      console.error("Stop Auction Error:", error);
      throw error;
    }
  },

  async cancel(id, io = null, reason = "Dibatalkan oleh penjual") {
    const auctionRes = await db.query(
      `SELECT product_id, quantity FROM auctions WHERE auction_id = $1`,
      [id]
    );

    if (auctionRes.rows.length === 0) {
      throw new Error("Auction not found");
    }

    const auction = auctionRes.rows[0];

    const bidsRes = await db.query(
      `SELECT bidder_id, bid_amount FROM auction_bids WHERE auction_id = $1`,
      [id]
    );

    const allBids = bidsRes.rows;

    for (const bid of allBids) {
      await db.query(
        `UPDATE users SET balance = balance + $1 WHERE user_id = $2`,
        [bid.bid_amount, bid.bidder_id]
      );
      console.log(`Refunded ${bid.bid_amount} to user ${bid.bidder_id}`);
    }

    await db.query(
      `UPDATE products SET stock = stock + $1 WHERE product_id = $2`,
      [auction.quantity, auction.product_id]
    );

    const updateRes = await db.query(
      `UPDATE auctions 
     SET status_auction = 'cancelled', 
         end_time = NOW()
     WHERE auction_id = $1 
     RETURNING *`,
      [id]
    );

    const cancelledAuction = updateRes.rows[0];

    if (io) {
      const roomName = `auction-room-${id}`;
      console.log(`[CANCEL] Broadcasting to room: ${roomName}`);

      io.to(roomName).emit("auction_cancelled", {
        auctionId: id,
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        reason: reason,
        totalRefunds: allBids.length,
        totalRefundAmount: allBids.reduce(
          (sum, bid) => sum + bid.bid_amount,
          0
        ),
        message: `Auction cancelled: ${reason}`,
        timestamp: new Date().toISOString(),
      });
    }

    await this.updateAuctionStatusByTime(id);

    return {
      ...cancelledAuction,
      refunds_count: allBids.length,
      refunds_total: allBids.reduce((sum, bid) => sum + bid.bid_amount, 0),
    };
  },
};