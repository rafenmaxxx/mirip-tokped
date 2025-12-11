import { AuctionsService } from "../service/s_auctions.js";

export const AuctionsController = {
  async getAll(req, res) {
    try {
      const auctions = await AuctionsService.getAll();
      res.json(auctions);
    } catch (error) {
      console.error("Error getting auctions:", error);
      res.status(500).json({ message: "Failed to fetch auctions" });
    }
  },

  async getById(req, res) {
    try {
      const auction = await AuctionsService.getById(req.params.id);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      res.json(auction);
    } catch (error) {
      console.error("Error getting auction by id:", error);
      res.status(500).json({ message: "Failed to fetch auction" });
    }
  },

  async getByStoreId(req, res) {
    try {
      const auctions = await AuctionsService.getByStoreId(req.params.storeId);
      res.json(auctions);
    } catch (error) {
      console.error("Error getting auctions by store id:", error);
      res.status(500).json({ message: "Failed to fetch auctions for store" });
    }
  },

  async create(req, res) {
    try {
      const auction = await AuctionsService.create(req.body);
      res.json(auction);
    } catch (error) {
      console.error("Error creating auction:", error);
      res.status(500).json({ message: "Failed to create auction" });
    }
  },

  async remove(req, res) {
    try {
      const result = await AuctionsService.remove(req.params.id);
      res.json(result);
    } catch (error) {
      console.error("Error removing auction:", error);
      res.status(500).json({ message: "Failed to remove auction" });
    }
  },

  async stop(req, res) {
    try {
      const id = req.params.id;
      const io = req.app.get("io");

      const data = await AuctionsService.stop(id, io);
      return res.json(data);
    } catch (err) {
      console.error("Stop Error:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  async cancel(req, res) {
    try {
      const id = req.params.id;
      const io = req.app.get("io");
      const auction = await AuctionsService.cancel(id, io);
      res.json(auction);
    } catch (error) {
      console.error("Error canceling auction:", error);
      res.status(500).json({
        message: error.message || "Failed to cancel auction",
      });
    }
  },
};
