const express = require('express');
const router = express.Router();
const { db } = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

// POST /api/v1/moderation/report
router.post('/report', authenticate, async (req, res, next) => {
  try {
    const { type, targetId, reason, description } = req.body;
    
    // type: 'user' or 'listing'
    // targetId: user_id or listing_id
    
    if (!type || !targetId || !reason) {
      return res.status(400).json({ error: 'type, targetId, and reason are required' });
    }
    
    const reportData = {
      reporter_id: req.user.userId,
      reason,
      description,
      status: 'pending'
    };
    
    if (type === 'user') {
      reportData.reported_user_id = targetId;
    } else if (type === 'listing') {
      reportData.reported_listing_id = targetId;
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }
    
    const { data: report, error } = await db.insert('reports', reportData, { select: '*' });
    
    if (error) throw error;
    
    res.status(201).json({ success: true, reportId: report[0]?.id });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/moderation/reports (admin only)
router.get('/reports', authenticate, async (req, res, next) => {
  try {
    const { status } = req.query;
    
    let filters = {};
    if (status) filters.status = status;
    
    const { data: reports, error } = await db.select('reports', '*', filters);
    
    if (error) throw error;
    res.json(reports || []);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/moderation/reports/:id
router.put('/reports/:id', authenticate, async (req, res, next) => {
  try {
    const { status, moderatorNotes } = req.body;
    
    const { data: report, error } = await db.update('reports', {
      status,
      moderator_notes: moderatorNotes,
      updated_at: new Date().toISOString()
    }, { id: req.params.id });
    
    if (error) throw error;
    res.json(report[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/moderation/flag-listing/:id (auto-flag based on keywords)
router.post('/flag-listing/:id', async (req, res, next) => {
  try {
    const { data: listing } = await db.select('listings', 'title,description', { id: req.params.id });
    if (!listing?.[0]) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Simple keyword check (in production, use more sophisticated detection)
    const suspiciousKeywords = ['free money', 'hack', 'crack', 'illegal', 'stolen'];
    const text = `${listing[0].title} ${listing[0].description}`.toLowerCase();
    const flagged = suspiciousKeywords.some(keyword => text.includes(keyword));
    
    if (flagged) {
      await db.update('listings', { status: 'flagged' }, { id: req.params.id });
      
      await db.insert('reports', {
        reason: 'auto_flagged',
        description: 'Auto-flagged by keyword detection',
        status: 'pending'
      });
      
      return res.json({ flagged: true, reason: 'Suspicious content detected' });
    }
    
    res.json({ flagged: false });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
