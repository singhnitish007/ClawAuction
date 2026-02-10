const express = require('express');
const router = express.Router();
const { db } = require('../lib/supabase');
const { authenticate, requireBot } = require('../middleware/auth');

// GET /api/v1/listings
router.get('/', async (req, res, next) => {
  try {
    const { status, category, sellerId } = req.query;
    
    let filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (sellerId) filters.seller_id = sellerId;
    
    const { data: listings, error } = await db.select('listings',
      '*, users(username,avatar_url,reputation_score)',
      filters
    );
    
    if (error) throw error;
    res.json(listings || []);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/listings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data: listing, error } = await db.select('listings',
      '*, users(id,username,avatar_url,reputation_score)',
      { id: req.params.id }
    );
    
    if (error) throw error;
    if (!listing?.[0]) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    res.json(listing[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/listings
router.post('/', authenticate, requireBot, async (req, res, next) => {
  try {
    const { title, description, category, startingPrice, minIncrement, fileUrl, previewUrl, version } = req.body;
    
    // Validate
    if (!title || !category || !startingPrice) {
      return res.status(400).json({ error: 'Title, category, and starting price are required' });
    }
    
    const { data: listing, error } = await db.insert('listings', {
      seller_id: req.user.userId,
      title,
      description,
      category,
      starting_price: parseFloat(startingPrice),
      current_price: parseFloat(startingPrice),
      min_increment: parseFloat(minIncrement) || 1,
      file_url: fileUrl,
      preview_url: previewUrl,
      version: version || '1.0.0',
      status: 'draft'
    }, { select: '*' });
    
    if (error) throw error;
    
    res.status(201).json(listing[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/listings/:id
router.put('/:id', authenticate, requireBot, async (req, res, next) => {
  try {
    // Check ownership
    const { data: existing } = await db.select('listings', 'seller_id,status', { id: req.params.id });
    if (!existing?.[0]) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (existing[0].seller_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (existing[0].status !== 'draft') {
      return res.status(400).json({ error: 'Can only edit draft listings' });
    }
    
    const { title, description, category, startingPrice, minIncrement, version } = req.body;
    
    const { data: listing, error } = await db.update('listings',
      {
        title,
        description,
        category,
        starting_price: parseFloat(startingPrice),
        current_price: parseFloat(startingPrice),
        min_increment: parseFloat(minIncrement) || 1,
        version,
        updated_at: new Date().toISOString()
      },
      { id: req.params.id }
    );
    
    if (error) throw error;
    res.json(listing[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/listings/:id
router.delete('/:id', authenticate, requireBot, async (req, res, next) => {
  try {
    const { data: existing } = await db.select('listings', 'seller_id,status', { id: req.params.id });
    if (!existing?.[0]) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (existing[0].seller_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { error } = await db.remove('listings', { id: req.params.id });
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
