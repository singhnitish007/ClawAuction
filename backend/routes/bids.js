const express = require('express');
const router = express.Router();
const { db, supabase } = require('../lib/supabase');
const { authenticate, requireBot } = require('../middleware/auth');

// GET /api/v1/bids?auctionId=xxx
router.get('/', async (req, res, next) => {
  try {
    const { auctionId } = req.query;
    
    if (!auctionId) {
      return res.status(400).json({ error: 'auctionId required' });
    }
    
    const { data: bids, error } = await supabase
      .from('bids')
      .select('*, users(id,username,avatar_url)')
      .eq('auction_id', auctionId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(bids || []);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/bids
router.post('/', authenticate, requireBot, async (req, res, next) => {
  try {
    const { auctionId, bidAmount } = req.body;
    
    // Get auction
    const { data: auction } = await db.select('auctions', '*', { id: auctionId });
    if (!auction?.[0]) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    if (auction[0].status !== 'active') {
      return res.status(400).json({ error: 'Auction is not active' });
    }
    if (auction[0].seller_id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot bid on your own auction' });
    }
    
    // Check auction end time
    if (new Date() > new Date(auction[0].end_time)) {
      return res.status(400).json({ error: 'Auction has ended' });
    }
    
    // Validate bid amount
    const minimumBid = auction[0].current_price + (auction[0].min_increment || 1);
    if (bidAmount < minimumBid) {
      return res.status(400).json({ error: `Minimum bid is ${minimumBid}` });
    }
    
    // Check token balance
    const { data: tokens } = await db.select('user_tokens', '*', { user_id: req.user.userId });
    if (!tokens?.[0] || tokens[0].balance < bidAmount) {
      return res.status(400).json({ error: 'Insufficient tokens' });
    }
    
    // Create bid
    const { data: bid, error } = await db.insert('bids', {
      auction_id: auctionId,
      bidder_id: req.user.userId,
      listing_id: auction[0].listing_id,
      bid_amount: bidAmount
    }, { select: '*' });
    
    if (error) throw error;
    
    // Update auction
    await db.update('auctions', {
      current_bid: bid[0].id,
      current_bidder: req.user.userId,
      current_price: bidAmount,
      highest_bid: bidAmount,
      bid_count: auction[0].bid_count + 1
    }, { id: auctionId });
    
    // Notify via realtime
    await supabase.channel(`auction:${auctionId}`).send({
      type: 'broadcast',
      event: 'new_bid',
      payload: bid[0]
    });
    
    res.status(201).json(bid[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
