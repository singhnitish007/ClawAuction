const express = require('express');
const router = express.Router();
const { db, supabase } = require('../lib/supabase');
const { authenticate, requireBot } = require('../middleware/auth');

// GET /api/v1/auctions
router.get('/', async (req, res, next) => {
  try {
    const { status, sellerId, bidderId } = req.query;
    
    let filters = {};
    if (status) filters.status = status;
    if (sellerId) filters.seller_id = sellerId;
    if (bidderId) filters.current_bidder = bidderId;
    
    let query = supabase
      .from('auctions')
      .select(`
        *,
        listings (
          *,
          users (id,username,avatar_url,reputation_score)
        ),
        users!auctions_seller_id_fkey (id,username,bot_name)
      `)
      .order('end_time', { ascending: filters.status === 'ended' ? 'desc' : 'asc' });
    
    if (status) query = query.eq('status', status);
    if (sellerId) query = query.eq('seller_id', sellerId);
    if (bidderId) query = query.eq('current_bidder', bidderId);
    
    const { data: auctions, error } = await query;
    
    if (error) throw error;
    res.json(auctions || []);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auctions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data: auction, error } = await supabase
      .from('auctions')
      .select(`
        *,
        listings (*),
        users!auctions_seller_id_fkey (id,username,bot_name,avatar_url,reputation_score)
      `)
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    
    res.json(auction);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auctions
router.post('/', authenticate, requireBot, async (req, res, next) => {
  try {
    const { listingId, durationHours = 24 } = req.body;
    
    // Verify listing ownership
    const { data: listing } = await db.select('listings', '*', { id: listingId });
    if (!listing?.[0]) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (listing[0].seller_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (listing[0].status !== 'draft') {
      return res.status(400).json({ error: 'Listing is not a draft' });
    }
    
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
    
    const { data: auction, error } = await db.insert('auctions', {
      listing_id: listingId,
      seller_id: req.user.userId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      current_price: listing[0].starting_price,
      highest_bid: listing[0].starting_price,
      bid_count: 0,
      status: 'active'
    }, { select: '*' });
    
    if (error) throw error;
    
    // Update listing status
    await db.update('listings', { status: 'active' }, { id: listingId });
    
    // Notify via realtime
    await supabase.channel('auctions').send({
      type: 'broadcast',
      event: 'new_auction',
      payload: auction[0]
    });
    
    res.status(201).json(auction[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auctions/:id/end (admin or automatic)
router.post('/:id/end', async (req, res, next) => {
  try {
    const { data: auction } = await db.select('auctions', '*', { id: req.params.id });
    if (!auction?.[0]) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    
    // Get highest bid
    const { data: highestBid } = await db.select('bids', '*', { auction_id: req.params.id });
    
    let winnerId = null;
    let finalPrice = auction[0].current_price;
    
    if (highestBid?.length > 0) {
      const sorted = highestBid.sort((a, b) => b.bid_amount - a.bid_amount);
      winnerId = sorted[0].bidder_id;
      finalPrice = sorted[0].bid_amount;
    }
    
    const { data: updated, error } = await db.update('auctions', {
      status: 'ended',
      winner_id: winnerId,
      final_price: finalPrice,
      end_time: new Date().toISOString()
    }, { id: req.params.id });
    
    if (error) throw error;
    
    // Update listing
    await db.update('listings', { status: winnerId ? 'sold' : 'cancelled' }, { id: auction[0].listing_id });
    
    // Notify
    await supabase.channel('auctions').send({
      type: 'broadcast',
      event: 'auction_ended',
      payload: { auctionId: req.params.id, winnerId, finalPrice }
    });
    
    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
