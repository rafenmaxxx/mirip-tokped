import { AuctionsService } from "../service/s_auctions.js";

export const AuctionsController = {
  async getAll(req, res) {
    try {
      const auctions = await AuctionsService.getAll();
      res.json(auctions);
    } catch (error) {
      console.error('Error getting auctions:', error);
      res.status(500).json({ message: 'Failed to fetch auctions' });
    }
  },

  async getById(req, res) {
    try {
      const auction = await AuctionsService.getById(req.params.id);
      if (!auction) {
        return res.status(404).json({ message: 'Auction not found' });
      }
      res.json(auction);
    } catch (error) {
      console.error('Error getting auction by id:', error);
      res.status(500).json({ message: 'Failed to fetch auction' });
    }
  },

  async create(req, res) {
    try {
      const auction = await AuctionsService.create(req.body);
      res.json(auction);
    } catch (error) {
      console.error('Error creating auction:', error);
      res.status(500).json({ message: 'Failed to create auction' });
    }
  },

  async remove(req, res) {
    try {
      const result = await AuctionsService.remove(req.params.id);
      res.json(result);
    } catch (error) {
      console.error('Error removing auction:', error);
      res.status(500).json({ message: 'Failed to remove auction' });
    }
  },

  async stop(req, res) {
    try {
      const auction = await AuctionsService.stop(req.params.id);
      res.json(auction);
    } catch (error) {
      console.error('Error stopping auction:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to stop auction' 
      });
    }
  },

  async cancel(req, res) {
    try {
      const auction = await AuctionsService.cancel(req.params.id);
      res.json(auction);
    } catch (error) {
      console.error('Error canceling auction:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to cancel auction' 
      });
    }
  }
};