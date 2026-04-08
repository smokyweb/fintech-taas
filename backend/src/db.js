const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../tradeflow.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    tier TEXT DEFAULT 'basic',
    kyc_status TEXT DEFAULT 'pending',
    balance REAL DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    reward_credits REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    strategy TEXT NOT NULL,
    pair TEXT NOT NULL,
    status TEXT DEFAULT 'stopped',
    risk_level TEXT DEFAULT 'medium',
    profit_target REAL DEFAULT 5,
    stop_loss REAL DEFAULT 3,
    allocated_amount REAL DEFAULT 1000,
    total_profit REAL DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    win_rate REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    bot_id TEXT,
    pair TEXT NOT NULL,
    type TEXT NOT NULL,
    entry_price REAL NOT NULL,
    exit_price REAL,
    quantity REAL NOT NULL,
    profit_loss REAL DEFAULT 0,
    status TEXT DEFAULT 'open',
    opened_at TEXT DEFAULT (datetime('now')),
    closed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (bot_id) REFERENCES bots(id)
  );

  CREATE TABLE IF NOT EXISTS funding_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    referrer_id TEXT NOT NULL,
    referred_id TEXT NOT NULL,
    reward_amount REAL DEFAULT 25,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (referrer_id) REFERENCES users(id),
    FOREIGN KEY (referred_id) REFERENCES users(id)
  );
`);

// Seed data if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

if (userCount === 0) {
  const adminHash = bcrypt.hashSync('admin1234', 10);
  const demoHash = bcrypt.hashSync('demo1234', 10);

  // Insert admin user
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, tier, kyc_status, balance, referral_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('admin-001', 'admin@tradeflow.demo', adminHash, 'Admin User', 'admin', 'platinum', 'verified', 50000, 'ADMIN001');

  // Insert demo user
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, tier, kyc_status, balance, referral_code, reward_credits)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('demo-001', 'demo@tradeflow.demo', demoHash, 'Alex Thompson', 'user', 'gold', 'verified', 15420.50, 'ALEX2024', 125);

  // Seed bots for demo user
  const bots = [
    ['bot-001', 'demo-001', 'EUR/USD Scalper', 'RSI', 'EUR/USD', 'active', 'medium', 5, 3, 3000, 342.50, 48, 0.68],
    ['bot-002', 'demo-001', 'BTC Trend Follower', 'MACD', 'BTC/USD', 'active', 'high', 5, 3, 5000, 1250.80, 23, 0.72],
    ['bot-003', 'demo-001', 'Gold Mean Rev', 'Mean_Reversion', 'GC/USD', 'paused', 'low', 5, 3, 2000, -85.20, 15, 0.47],
    ['bot-004', 'demo-001', 'ETH Momentum', 'Moving_Average', 'ETH/USD', 'active', 'medium', 5, 3, 2500, 520.30, 31, 0.65],
    ['bot-005', 'demo-001', 'GBP/JPY Scalper', 'Scalping', 'GBP/JPY', 'stopped', 'high', 5, 3, 1500, 125.60, 67, 0.58],
  ];

  const insertBot = db.prepare(`
    INSERT INTO bots (id, user_id, name, strategy, pair, status, risk_level, profit_target, stop_loss, allocated_amount, total_profit, total_trades, win_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const bot of bots) {
    insertBot.run(...bot);
  }

  // Seed closed trades
  const insertTrade = db.prepare(`
    INSERT INTO trades (id, user_id, bot_id, pair, type, entry_price, exit_price, quantity, profit_loss, status, opened_at, closed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const closedTrades = [
    [uuidv4(), 'demo-001', 'bot-001', 'EUR/USD', 'buy', 1.0842, 1.0868, 10000, 26.00, 'closed', '2024-02-01 10:30:00', '2024-02-01 14:20:00'],
    [uuidv4(), 'demo-001', 'bot-001', 'EUR/USD', 'sell', 1.0871, 1.0845, 10000, 26.00, 'closed', '2024-02-02 09:15:00', '2024-02-02 11:45:00'],
    [uuidv4(), 'demo-001', 'bot-002', 'BTC/USD', 'buy', 66800, 67250, 0.5, 225.00, 'closed', '2024-02-03 08:00:00', '2024-02-03 16:30:00'],
    [uuidv4(), 'demo-001', 'bot-001', 'EUR/USD', 'buy', 1.0855, 1.0830, 10000, -25.00, 'closed', '2024-02-04 10:00:00', '2024-02-04 12:30:00'],
    [uuidv4(), 'demo-001', 'bot-002', 'BTC/USD', 'sell', 67500, 67100, 0.3, 120.00, 'closed', '2024-02-05 11:00:00', '2024-02-05 15:00:00'],
    [uuidv4(), 'demo-001', 'bot-004', 'ETH/USD', 'buy', 3800, 3870, 2, 140.00, 'closed', '2024-02-06 09:30:00', '2024-02-06 14:00:00'],
    [uuidv4(), 'demo-001', 'bot-003', 'GC/USD', 'buy', 2305, 2298, 5, -35.00, 'closed', '2024-02-07 10:00:00', '2024-02-07 16:00:00'],
    [uuidv4(), 'demo-001', 'bot-005', 'GBP/JPY', 'sell', 189.50, 189.20, 5000, 15.00, 'closed', '2024-02-08 08:30:00', '2024-02-08 09:45:00'],
    [uuidv4(), 'demo-001', 'bot-001', 'EUR/USD', 'buy', 1.0860, 1.0892, 15000, 48.00, 'closed', '2024-02-09 10:00:00', '2024-02-09 13:30:00'],
    [uuidv4(), 'demo-001', 'bot-002', 'BTC/USD', 'buy', 67100, 67800, 0.4, 280.00, 'closed', '2024-02-10 07:00:00', '2024-02-10 18:00:00'],
    [uuidv4(), 'demo-001', 'bot-004', 'ETH/USD', 'sell', 3860, 3820, 1.5, 60.00, 'closed', '2024-02-11 09:00:00', '2024-02-11 12:30:00'],
    [uuidv4(), 'demo-001', 'bot-005', 'GBP/JPY', 'buy', 189.10, 189.45, 3000, 10.50, 'closed', '2024-02-12 08:00:00', '2024-02-12 10:00:00'],
    [uuidv4(), 'demo-001', 'bot-003', 'GC/USD', 'sell', 2310, 2315, 3, -15.00, 'closed', '2024-02-13 11:00:00', '2024-02-13 15:00:00'],
    [uuidv4(), 'demo-001', 'bot-001', 'EUR/USD', 'sell', 1.0895, 1.0870, 12000, 30.00, 'closed', '2024-02-14 09:30:00', '2024-02-14 11:00:00'],
    [uuidv4(), 'demo-001', 'bot-002', 'BTC/USD', 'buy', 67600, 68100, 0.25, 125.00, 'closed', '2024-02-15 10:00:00', '2024-02-15 20:00:00'],
  ];

  for (const trade of closedTrades) {
    insertTrade.run(...trade);
  }

  // Seed open trades
  const openTrades = [
    [uuidv4(), 'demo-001', 'bot-001', 'EUR/USD', 'buy', 1.0856, null, 10000, 0, 'open', '2024-02-16 10:00:00', null],
    [uuidv4(), 'demo-001', 'bot-002', 'BTC/USD', 'buy', 67420, null, 0.3, 0, 'open', '2024-02-16 08:30:00', null],
    [uuidv4(), 'demo-001', 'bot-004', 'ETH/USD', 'sell', 3845, null, 1.2, 0, 'open', '2024-02-16 09:15:00', null],
    [uuidv4(), 'demo-001', 'bot-005', 'GBP/JPY', 'buy', 189.30, null, 5000, 0, 'open', '2024-02-16 07:45:00', null],
    [uuidv4(), 'demo-001', 'bot-003', 'GC/USD', 'buy', 2312, null, 2, 0, 'open', '2024-02-16 11:00:00', null],
  ];

  for (const trade of openTrades) {
    insertTrade.run(...trade);
  }

  // Seed funding requests
  const insertFunding = db.prepare(`
    INSERT INTO funding_requests (id, user_id, type, amount, method, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertFunding.run(uuidv4(), 'demo-001', 'deposit', 5000, 'bank_transfer', 'approved', '2024-01-15 10:00:00');
  insertFunding.run(uuidv4(), 'demo-001', 'deposit', 10000, 'crypto', 'approved', '2024-01-20 14:30:00');
  insertFunding.run(uuidv4(), 'demo-001', 'withdrawal', 500, 'bank_transfer', 'pending', '2024-02-10 09:00:00');

  // Seed referrals
  // Create two referred users first
  const ref1Hash = bcrypt.hashSync('user1234', 10);
  const ref2Hash = bcrypt.hashSync('user1234', 10);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, tier, kyc_status, balance, referral_code, referred_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('ref-001', 'sarah@example.com', ref1Hash, 'Sarah Wilson', 'user', 'basic', 'verified', 2500, 'SARAH01', 'ALEX2024');

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, tier, kyc_status, balance, referral_code, referred_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('ref-002', 'mike@example.com', ref2Hash, 'Mike Chen', 'user', 'basic', 'pending', 1000, 'MIKE001', 'ALEX2024');

  const insertReferral = db.prepare(`
    INSERT INTO referrals (id, referrer_id, referred_id, reward_amount, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertReferral.run(uuidv4(), 'demo-001', 'ref-001', 25, 'paid', '2024-01-20 10:00:00');
  insertReferral.run(uuidv4(), 'demo-001', 'ref-002', 25, 'pending', '2024-02-05 14:30:00');

  console.log('Database seeded successfully');
}

module.exports = db;
