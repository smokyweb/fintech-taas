const express = require('express');
const router = express.Router();

function fluctuate(base, pct = 0.002) {
  return Math.round((base * (1 + (Math.random() * 2 - 1) * pct)) * 10000) / 10000;
}

// GET /api/market/forex
router.get('/forex', (req, res) => {
  const pairs = [
    { symbol: 'EUR/USD', base: 1.0856 },
    { symbol: 'GBP/USD', base: 1.2634 },
    { symbol: 'USD/JPY', base: 149.82 },
    { symbol: 'AUD/USD', base: 0.6523 },
    { symbol: 'USD/CAD', base: 1.3641 },
    { symbol: 'EUR/GBP', base: 0.8594 },
    { symbol: 'USD/CHF', base: 0.8812 },
    { symbol: 'NZD/USD', base: 0.6134 },
  ];

  const data = pairs.map(p => {
    const bid = fluctuate(p.base);
    const spreadPips = Math.round(Math.random() * 3 + 0.5) / 10;
    const ask = Math.round((bid + spreadPips * 0.0001) * 10000) / 10000;
    return {
      symbol: p.symbol,
      bid,
      ask,
      spread: spreadPips,
      change_24h: Math.round((Math.random() * 2 - 1) * 100) / 100,
      volume: Math.round(Math.random() * 50000 + 10000),
      trend: Math.random() > 0.5 ? 'up' : 'down'
    };
  });

  res.json(data);
});

// GET /api/market/crypto
router.get('/crypto', (req, res) => {
  const coins = [
    { symbol: 'BTC/USD', name: 'Bitcoin', base: 67420, mcap: 1320, vol: 28.5 },
    { symbol: 'ETH/USD', name: 'Ethereum', base: 3845, mcap: 462, vol: 15.2 },
    { symbol: 'SOL/USD', name: 'Solana', base: 182, mcap: 82, vol: 4.8 },
    { symbol: 'BNB/USD', name: 'BNB', base: 412, mcap: 63, vol: 1.9 },
    { symbol: 'XRP/USD', name: 'Ripple', base: 0.6234, mcap: 34, vol: 2.1 },
  ];

  const data = coins.map(c => {
    const price = Math.round(fluctuate(c.base, 0.005) * 100) / 100;
    const sparkline = [];
    let sp = c.base;
    for (let i = 0; i < 7; i++) {
      sp = sp * (1 + (Math.random() * 0.06 - 0.03));
      sparkline.push(Math.round(sp * 100) / 100);
    }
    return {
      symbol: c.symbol,
      name: c.name,
      price,
      change_24h: Math.round((Math.random() * 10 - 5) * 100) / 100,
      market_cap_b: c.mcap,
      volume_24h_b: Math.round(c.vol * (0.9 + Math.random() * 0.2) * 10) / 10,
      sparkline
    };
  });

  res.json(data);
});

// GET /api/market/futures
router.get('/futures', (req, res) => {
  const futures = [
    { symbol: 'ES', name: 'S&P 500 E-mini', base: 5243, expiry: '2024-03-15' },
    { symbol: 'NQ', name: 'Nasdaq 100 E-mini', base: 18234, expiry: '2024-03-15' },
    { symbol: 'CL', name: 'Crude Oil WTI', base: 78.45, expiry: '2024-03-20' },
    { symbol: 'GC', name: 'Gold', base: 2312, expiry: '2024-04-26' },
    { symbol: 'SI', name: 'Silver', base: 27.34, expiry: '2024-03-27' },
  ];

  const data = futures.map(f => ({
    symbol: f.symbol,
    name: f.name,
    price: Math.round(fluctuate(f.base, 0.003) * 100) / 100,
    change_24h: Math.round((Math.random() * 4 - 2) * 100) / 100,
    expiry: f.expiry,
    volume: Math.round(Math.random() * 100000 + 20000)
  }));

  res.json(data);
});

module.exports = router;
