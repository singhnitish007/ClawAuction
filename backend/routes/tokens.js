const express = require('express');
const router = express.Router();
const { db } = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/tokens/balance
router.get('/balance', authenticate, async (req, res, next) => {
  try {
    const { data: tokens, error } = await db.select('user_tokens', '*', { user_id: req.user.userId });
    
    if (error) throw error;
    res.json(tokens?.[0] || { balance: 100 });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/tokens/transactions
router.get('/transactions', authenticate, async (req, res, next) => {
  try {
    const { data: transactions, error } = await db.select('transactions', '*', { user_id: req.user.userId });
    
    if (error) throw error;
    res.json(transactions || []);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/tokens/deposit (for humans)
router.post('/deposit', authenticate, async (req, res, next) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // Get current balance
    const { data: tokens } = await db.select('user_tokens', '*', { user_id: req.user.userId });
    const currentBalance = tokens?.[0]?.balance || 0;
    const newBalance = currentBalance + parseFloat(amount);
    
    // Update balance
    if (tokens?.[0]) {
      await db.update('user_tokens', { balance: newBalance }, { user_id: req.user.userId });
    } else {
      await db.insert('user_tokens', { user_id: req.user.userId, balance: newBalance });
    }
    
    // Record transaction
    await db.insert('transactions', {
      user_id: req.user.userId,
      type: 'deposit',
      amount: parseFloat(amount),
      balance_after: newBalance,
      description: 'Token deposit'
    });
    
    res.json({ balance: newBalance });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/tokens/transfer
router.post('/transfer', authenticate, async (req, res, next) => {
  try {
    const { toUserId, amount } = req.body;
    
    if (!toUserId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    // Get sender balance
    const { data: senderTokens } = await db.select('user_tokens', '*', { user_id: req.user.userId });
    const senderBalance = senderTokens?.[0]?.balance || 0;
    
    if (senderBalance < amount) {
      return res.status(400).json({ error: 'Insufficient tokens' });
    }
    
    // Get recipient
    const { data: recipient } = await db.select('users', 'id', { id: toUserId });
    if (!recipient?.[0]) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    // Get recipient balance
    const { data: recipientTokens } = await db.select('user_tokens', '*', { user_id: toUserId });
    const recipientBalance = recipientTokens?.[0]?.balance || 0;
    
    // Update balances
    await db.update('user_tokens', { balance: senderBalance - amount }, { user_id: req.user.userId });
    await db.update('user_tokens', { balance: recipientBalance + amount }, { user_id: toUserId });
    
    // Record transactions
    await db.insert('transactions', {
      user_id: req.user.userId,
      type: 'transfer_out',
      amount: -parseFloat(amount),
      balance_after: senderBalance - amount,
      reference_id: toUserId,
      description: `Transfer to ${toUserId}`
    });
    
    await db.insert('transactions', {
      user_id: toUserId,
      type: 'transfer_in',
      amount: parseFloat(amount),
      balance_after: recipientBalance + amount,
      reference_id: req.user.userId,
      description: `Transfer from ${req.user.userId}`
    });
    
    res.json({ success: true, newBalance: senderBalance - amount });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
