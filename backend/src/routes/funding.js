const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/funding
router.get('/', (req, res) => {
  try {
    const requests = db.prepare('SELECT * FROM funding_requests WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/funding/deposit
router.post('/deposit', (req, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });
    if (!method) return res.status(400).json({ error: 'Payment method required' });

    const id = uuidv4();
    // Auto-approve in demo mode
    db.prepare(`
      INSERT INTO funding_requests (id, user_id, type, amount, method, status)
      VALUES (?, ?, 'deposit', ?, ?, 'approved')
    `).run(id, req.user.id, amount, method);

    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.user.id);

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Deposit successful', balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/funding/withdraw
router.post('/withdraw', (req, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });
    if (!method) return res.status(400).json({ error: 'Payment method required' });

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    if (amount > user.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const id = uuidv4();
    // Auto-approve in demo mode
    db.prepare(`
      INSERT INTO funding_requests (id, user_id, type, amount, method, status)
      VALUES (?, ?, 'withdrawal', ?, ?, 'approved')
    `).run(id, req.user.id, amount, method);

    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);

    const updatedUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Withdrawal successful', balance: updatedUser.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/funding/methods
router.get('/methods', (req, res) => {
  res.json([
    { id: 'bank_transfer', name: 'Bank Transfer', fee: 0, min: 100, max: 50000, processing: '1-3 business days' },
    { id: 'crypto', name: 'Crypto Wallet', fee: 0.5, min: 10, max: 100000, processing: '10-30 minutes' },
    { id: 'card', name: 'Credit/Debit Card', fee: 2.5, min: 50, max: 10000, processing: 'Instant' },
  ]);
});

module.exports = router;
