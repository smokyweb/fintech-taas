const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/trading/positions
router.get('/positions', (req, res) => {
  try {
    const positions = db.prepare("SELECT * FROM trades WHERE user_id = ? AND status = 'open'").all(req.user.id);

    const withPnL = positions.map(pos => {
      const fluctuation = 1 + (Math.random() * 0.04 - 0.02);
      const currentPrice = pos.entry_price * fluctuation;
      const unrealized_pnl = pos.type === 'buy'
        ? (currentPrice - pos.entry_price) * pos.quantity
        : (pos.entry_price - currentPrice) * pos.quantity;

      return {
        ...pos,
        current_price: Math.round(currentPrice * 100) / 100,
        unrealized_pnl: Math.round(unrealized_pnl * 100) / 100
      };
    });

    res.json(withPnL);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trading/history
router.get('/history', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const pair = req.query.pair;
    const type = req.query.type;

    let query = "SELECT * FROM trades WHERE user_id = ? AND status = 'closed'";
    const params = [req.user.id];

    if (pair) {
      query += ' AND pair = ?';
      params.push(pair);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    const total = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params).count;

    query += ' ORDER BY closed_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const trades = db.prepare(query).all(...params);

    res.json({
      trades,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trading/portfolio
router.get('/portfolio', (req, res) => {
  try {
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    const bots = db.prepare('SELECT * FROM bots WHERE user_id = ?').all(req.user.id);
    const openTrades = db.prepare("SELECT * FROM trades WHERE user_id = ? AND status = 'open'").all(req.user.id);
    const closedStats = db.prepare("SELECT COALESCE(SUM(profit_loss), 0) as realized_pnl FROM trades WHERE user_id = ? AND status = 'closed'").get(req.user.id);

    // Unrealized P&L
    let unrealizedPnL = 0;
    openTrades.forEach(pos => {
      const fluctuation = 1 + (Math.random() * 0.04 - 0.02);
      const currentPrice = pos.entry_price * fluctuation;
      const pnl = pos.type === 'buy'
        ? (currentPrice - pos.entry_price) * pos.quantity
        : (pos.entry_price - currentPrice) * pos.quantity;
      unrealizedPnL += pnl;
    });

    // Portfolio allocation from bots
    const allocation = bots.map(bot => ({
      name: bot.name,
      pair: bot.pair,
      value: bot.allocated_amount,
      profit: bot.total_profit
    }));

    // 30 day equity curve
    const equityCurve = [];
    let equity = user.balance - 2000;
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      equity += (Math.random() - 0.45) * 200;
      equityCurve.push({
        date: date.toISOString().split('T')[0],
        equity: Math.round(equity * 100) / 100
      });
    }

    res.json({
      total_value: user.balance,
      unrealized_pnl: Math.round(unrealizedPnL * 100) / 100,
      realized_pnl: closedStats.realized_pnl,
      allocation,
      equity_curve: equityCurve
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trading/pnl
router.get('/pnl', (req, res) => {
  try {
    const pnlData = [];
    let cumulative = 0;
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dailyPnl = Math.round((Math.random() - 0.42) * 300 * 100) / 100;
      cumulative += dailyPnl;
      pnlData.push({
        date: date.toISOString().split('T')[0],
        pnl: dailyPnl,
        cumulative: Math.round(cumulative * 100) / 100
      });
    }

    res.json(pnlData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
