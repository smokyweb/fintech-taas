require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database (creates tables + seeds data)
require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const botsRoutes = require('./routes/bots');
const tradingRoutes = require('./routes/trading');
const marketRoutes = require('./routes/market');
const fundingRoutes = require('./routes/funding');
const referralsRoutes = require('./routes/referrals');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3061;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/bots', botsRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/funding', fundingRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend in production
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`TradeFlow API running on port ${PORT}`);
});
