const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const VALID_STRATEGIES = ['RSI', 'MACD', 'Moving_Average', 'Mean_Reversion', 'Scalping'];
const VALID_RISK_LEVELS = ['low', 'medium', 'high'];

// GET /api/bots
router.get('/', (req, res) => {
  try {
    const bots = db.prepare('SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(bots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bots
router.post('/', (req, res) => {
  try {
    const { name, strategy, pair, risk_level, allocated_amount, profit_target, stop_loss } = req.body;

    if (!name || !strategy || !pair) {
      return res.status(400).json({ error: 'Name, strategy, and pair are required' });
    }
    if (!VALID_STRATEGIES.includes(strategy)) {
      return res.status(400).json({ error: 'Invalid strategy' });
    }
    if (risk_level && !VALID_RISK_LEVELS.includes(risk_level)) {
      return res.status(400).json({ error: 'Invalid risk level' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO bots (id, user_id, name, strategy, pair, risk_level, allocated_amount, profit_target, stop_loss)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, name, strategy, pair, risk_level || 'medium', allocated_amount || 1000, profit_target || 5, stop_loss || 3);

    const bot = db.prepare('SELECT * FROM bots WHERE id = ?').get(id);
    res.json(bot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bots/:id
router.patch('/:id', (req, res) => {
  try {
    const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    const { name, strategy, pair, risk_level, allocated_amount, profit_target, stop_loss } = req.body;
    db.prepare(`
      UPDATE bots SET
        name = COALESCE(?, name),
        strategy = COALESCE(?, strategy),
        pair = COALESCE(?, pair),
        risk_level = COALESCE(?, risk_level),
        allocated_amount = COALESCE(?, allocated_amount),
        profit_target = COALESCE(?, profit_target),
        stop_loss = COALESCE(?, stop_loss)
      WHERE id = ?
    `).run(name, strategy, pair, risk_level, allocated_amount, profit_target, stop_loss, req.params.id);

    const updated = db.prepare('SELECT * FROM bots WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bots/:id
router.delete('/:id', (req, res) => {
  try {
    const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    db.prepare('DELETE FROM bots WHERE id = ?').run(req.params.id);
    res.json({ message: 'Bot deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bots/:id/activate
router.post('/:id/activate', (req, res) => {
  try {
    const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    db.prepare("UPDATE bots SET status = 'active' WHERE id = ?").run(req.params.id);
    const updated = db.prepare('SELECT * FROM bots WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bots/:id/pause
router.post('/:id/pause', (req, res) => {
  try {
    const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    db.prepare("UPDATE bots SET status = 'paused' WHERE id = ?").run(req.params.id);
    const updated = db.prepare('SELECT * FROM bots WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bots/:id/performance
router.get('/:id/performance', (req, res) => {
  try {
    const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    const performance = [];
    const now = new Date();
    let cumProfit = 0;
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dailyProfit = (Math.random() - 0.45) * (bot.allocated_amount * 0.02);
      cumProfit += dailyProfit;
      performance.push({
        date: date.toISOString().split('T')[0],
        profit: Math.round(cumProfit * 100) / 100,
        trades: Math.floor(Math.random() * 5) + 1
      });
    }

    res.json(performance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
