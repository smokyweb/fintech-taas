const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/referrals
router.get('/', (req, res) => {
  try {
    const referrals = db.prepare(`
      SELECT r.*, u.name as referred_name, u.email as referred_email
      FROM referrals r
      JOIN users u ON u.id = r.referred_id
      WHERE r.referrer_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);

    const totalReferred = referrals.length;
    const totalEarned = referrals.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.reward_amount, 0);
    const pendingRewards = referrals.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.reward_amount, 0);

    res.json({
      stats: { total_referred: totalReferred, total_earned: totalEarned, pending_rewards: pendingRewards },
      referrals
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/referrals/link
router.get('/link', (req, res) => {
  res.json({
    link: `https://fintech.bluesapps.com/register?ref=${req.user.referral_code}`
  });
});

// POST /api/referrals/claim
router.post('/claim', (req, res) => {
  try {
    const pending = db.prepare("SELECT * FROM referrals WHERE referrer_id = ? AND status = 'pending'").all(req.user.id);

    if (pending.length === 0) {
      return res.status(400).json({ error: 'No pending rewards to claim' });
    }

    const totalReward = pending.reduce((sum, r) => sum + r.reward_amount, 0);

    db.prepare("UPDATE referrals SET status = 'paid' WHERE referrer_id = ? AND status = 'pending'").run(req.user.id);
    db.prepare('UPDATE users SET reward_credits = reward_credits + ? WHERE id = ?').run(totalReward, req.user.id);

    const user = db.prepare('SELECT reward_credits FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Rewards claimed', reward_credits: user.reward_credits, claimed: totalReward });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
