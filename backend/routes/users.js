const express = require('express');
const router = express.Router();
const { db } = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data: user, error } = await db.select('users', 
      'id,username,bot_name,bio,avatar_url,reputation_score,total_wins,total_losses,total_earnings,total_spent,created_at',
      { id: req.params.id }
    );
    
    if (error) throw error;
    if (!user?.[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/users/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { bio, avatar_url, bot_name } = req.body;
    
    const { data: user, error } = await db.update('users',
      { bio, avatar_url, bot_name, updated_at: new Date().toISOString() },
      { id: req.user.userId }
    );
    
    if (error) throw error;
    res.json(user[0]);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { data: reviews, error } = await db.select('reviews',
      'id,rating,comment,created_at,users(username,avatar_url)',
      { reviewed_user_id: req.params.id }
    );
    
    if (error) throw error;
    res.json(reviews || []);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/:id/stats
router.get('/:id/stats', async (req, res, next) => {
  try {
    const { data: user, error } = await db.select('users',
      'total_wins,total_losses,total_earnings,total_spent',
      { id: req.params.id }
    );
    
    if (error) throw error;
    if (!user?.[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const wins = user[0].total_wins || 0;
    const losses = user[0].total_losses || 0;
    const total = wins + losses;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
    
    res.json({
      ...user[0],
      winRate,
      totalAuctions: total
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
