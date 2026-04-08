const express = require('express');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalBots = db.prepare('SELECT COUNT(*) as count FROM bots').get().count;
    const activeBots = db.prepare("SELECT COUNT(*) as count FROM bots WHERE status = 'active'").get().count;
    const totalVolume = db.prepare('SELECT COALESCE(SUM(allocated_amount), 0) as total FROM bots').get().total;
    const totalDeposits = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM funding_requests WHERE type = 'deposit' AND status = 'approved'").get().total;
    const pendingFunding = db.prepare("SELECT COUNT(*) as count FROM funding_requests WHERE status = 'pending'").get().count;

    res.json({ total_users: totalUsers, total_bots: totalBots, active_bots: activeBots, total_volume: totalVolume, total_deposits: totalDeposits, pending_funding: pendingFunding });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = 'SELECT id, email, name, role, tier, kyc_status, balance, referral_code, reward_credits, created_at FROM users';
    const params = [];

    if (search) {
      query += ' WHERE name LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const total = db.prepare(query.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as count FROM')).get(...params).count;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const users = db.prepare(query).all(...params);

    // Add bot counts
    const usersWithStats = users.map(u => {
      const botCount = db.prepare('SELECT COUNT(*) as count FROM bots WHERE user_id = ?').get(u.id).count;
      return { ...u, bot_count: botCount };
    });

    res.json({ users: usersWithStats, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', (req, res) => {
  try {
    const { tier, kyc_status, balance } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    db.prepare(`
      UPDATE users SET
        tier = COALESCE(?, tier),
        kyc_status = COALESCE(?, kyc_status),
        balance = COALESCE(?, balance)
      WHERE id = ?
    `).run(tier, kyc_status, balance, req.params.id);

    const updated = db.prepare('SELECT id, email, name, role, tier, kyc_status, balance, referral_code, reward_credits, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/bots
router.get('/bots', (req, res) => {
  try {
    const bots = db.prepare(`
      SELECT b.*, u.name as user_name, u.email as user_email
      FROM bots b
      JOIN users u ON u.id = b.user_id
      ORDER BY b.created_at DESC
    `).all();
    res.json(bots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/funding
router.get('/funding', (req, res) => {
  try {
    const status = req.query.status;
    let query = `
      SELECT f.*, u.name as user_name, u.email as user_email
      FROM funding_requests f
      JOIN users u ON u.id = f.user_id
    `;
    const params = [];

    if (status) {
      query += ' WHERE f.status = ?';
      params.push(status);
    }

    query += ' ORDER BY f.created_at DESC';
    const requests = db.prepare(query).all(...params);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/funding/:id
router.patch('/funding/:id', (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const request = db.prepare('SELECT * FROM funding_requests WHERE id = ?').get(req.params.id);
    if (!request) return res.status(404).json({ error: 'Funding request not found' });

    db.prepare('UPDATE funding_requests SET status = ? WHERE id = ?').run(status, req.params.id);

    // If approving a deposit, add to user balance
    if (status === 'approved' && request.type === 'deposit') {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(request.amount, request.user_id);
    }

    const updated = db.prepare('SELECT * FROM funding_requests WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
