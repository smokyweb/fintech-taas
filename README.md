# TradeFlow - Automated Trading-as-a-Service (TaaS) Platform

A full-stack fintech demo application for automated trading bot management with real-time market data simulation.

## Features

- **Trading Bots**: Create, manage, and monitor automated trading bots with multiple strategies (RSI, MACD, Moving Average, Mean Reversion, Scalping)
- **Live Market Data**: Simulated real-time forex, crypto, and futures market prices
- **Portfolio Management**: Track positions, P&L, and portfolio allocation
- **Funding**: Deposit and withdrawal management with multiple payment methods
- **Referral System**: Invite users and earn rewards
- **Admin Panel**: User management, bot oversight, and funding request approvals
- **KYC System**: Simulated identity verification workflow
- **Tiered Accounts**: Basic, Silver, Gold, and Platinum tiers

## Tech Stack

**Backend**: Node.js, Express, SQLite (better-sqlite3), JWT, bcrypt
**Frontend**: React 18, Vite, Tailwind CSS, Recharts, Zustand, React Router

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Server runs on http://localhost:3061

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dev server runs on http://localhost:5173 with API proxy to backend.

### Production Build

```bash
cd frontend
npm run build
```

Built files go to `dist/` in the project root, served by the backend.

## Demo Credentials

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@tradeflow.demo     | admin1234  |
| User  | demo@tradeflow.demo      | demo1234   |

## Deployment (PM2 + Nginx)

```bash
cd backend
pm2 start ecosystem.config.js
```

Copy `nginx.conf` to your Nginx sites configuration.

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `GET /api/user/stats` - User statistics
- `GET/POST /api/bots` - List/create bots
- `GET /api/market/forex` - Live forex prices
- `GET /api/market/crypto` - Live crypto prices
- `GET /api/trading/positions` - Open positions
- `GET /api/trading/history` - Trade history
- `POST /api/funding/deposit` - Deposit funds
- `GET /api/referrals` - Referral stats
- `GET /api/admin/stats` - Admin dashboard stats
