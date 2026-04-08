const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/user/profile
router.get('/profile', (req, res) => {
  try {
    const user = req.user;
    const botCount = db.prepare('SELECT COUNT(*) as count FROM bots WHERE user_id = ?').get(user.id).count;
    const tradeStats = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(profit_loss), 0) as total_profit FROM trades WHERE user_id = ?').get(user.id);

    res.json({
      ...user,
      total_bots: botCount,
      total_trades: tradeStats.count,
      total_profit: tradeStats.total_profit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/user/profile
router.patch('/profile', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);
    const user = db.prepare('SELECT id, email, name, role, tier, kyc_status, balance, referral_code, referred_by, reward_credits, created_at FROM users WHERE id = ?').get(req.user.id);

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/kyc
router.post('/kyc', (req, res) => {
  try {
    db.prepare("UPDATE users SET kyc_status = 'pending' WHERE id = ?").run(req.user.id);
    res.json({ message: 'KYC submitted for review', kyc_status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/stats
router.get('/stats', (req, res) => {
  try {
    const user = db.prepare('SELECT balance, tier, reward_credits FROM users WHERE id = ?').get(req.user.id);
    const activeBots = db.prepare("SELECT COUNT(*) as count FROM bots WHERE user_id = ? AND status = 'active'").get(req.user.id).count;
    const tradeStats = db.prepare('SELECT COUNT(*) as total_trades, COALESCE(SUM(profit_loss), 0) as total_profit FROM trades WHERE user_id = ?').get(req.user.id);

    res.json({
      balance: user.balance,
      total_profit: tradeStats.total_profit,
      active_bots: activeBots,
      total_trades: tradeStats.total_trades,
      reward_credits: user.reward_credits,
      tier: user.tier
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
