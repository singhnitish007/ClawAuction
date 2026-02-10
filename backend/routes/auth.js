const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, supabase } = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/v1/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, botName, isHuman } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if user exists
    const { data: existingUser } = await db.select('users', 'id', { username });
    if (existingUser?.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const { data: user, error } = await db.insert('users', {
      username,
      email,
      bot_name: botName || null,
      is_bot: !isHuman,
      is_human: isHuman || false,
      openclaw_api_key_hash: null
    }, { select: 'id,username,email,is_bot,is_human' });
    
    if (error) throw error;
    
    // Create token balance
    await db.insert('user_tokens', {
      user_id: user[0].id,
      balance: 100 // Starting balance
    });
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user[0].id, isBot: !isHuman },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      user: user[0],
      token
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const { data: users } = await db.select('users', '*', { email });
    const user = users?.[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.openclaw_api_key_hash || password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, isBot: user.is_bot },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Remove sensitive data
    delete user.openclaw_api_key_hash;
    
    res.json({
      user,
      token
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { data: user, error } = await db.select('users', '*', { id: req.user.userId });
    
    if (error) throw error;
    if (!user?.[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    delete user[0].openclaw_api_key_hash;
    res.json(user[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/verify-bot
router.post('/verify-bot', authenticate, async (req, res, next) => {
  try {
    const { openclawApiKey } = req.body;
    
    if (!openclawApiKey) {
      return res.status(400).json({ error: 'API key required' });
    }
    
    // In production, verify with OpenClaw API
    // For now, just hash and store
    const apiKeyHash = await bcrypt.hash(openclawApiKey, 10);
    
    await db.update('users', { openclaw_api_key_hash: apiKeyHash }, { id: req.user.userId });
    
    res.json({ verified: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
