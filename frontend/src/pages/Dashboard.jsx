import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Bot, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import client from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [pnlData, setPnlData] = useState([]);
  const [bots, setBots] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/user/stats'),
      client.get('/trading/pnl'),
      client.get('/bots'),
      client.get('/trading/history?limit=5'),
    ]).then(([statsRes, pnlRes, botsRes, tradesRes]) => {
      setStats(statsRes.data);
      setPnlData(pnlRes.data);
      setBots(botsRes.data.filter(b => b.status === 'active').slice(0, 3));
      setTrades(tradesRes.data.trades || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div></div>;
  }

  const statCards = [
    { label: 'Total Balance', value: `$${stats?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`, icon: DollarSign, color: 'text-green-400', change: '+2.4%' },
    { label: 'Portfolio P&L', value: `$${stats?.total_profit?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`, icon: TrendingUp, color: stats?.total_profit >= 0 ? 'text-green-400' : 'text-red-400', change: stats?.total_profit >= 0 ? '+5.2%' : '-2.1%' },
    { label: 'Active Bots', value: stats?.active_bots || 0, icon: Bot, color: 'text-blue-400', change: null },
    { label: 'Total Trades', value: stats?.total_trades || 0, icon: BarChart3, color: 'text-purple-400', change: null },
  ];

  const strategyColors = { RSI: 'bg-blue-500/20 text-blue-400', MACD: 'bg-purple-500/20 text-purple-400', Moving_Average: 'bg-cyan-500/20 text-cyan-400', Mean_Reversion: 'bg-orange-500/20 text-orange-400', Scalping: 'bg-pink-500/20 text-pink-400' };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{card.label}</span>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            {card.change && (
              <span className={`text-xs font-medium ${card.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {card.change} this month
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Performance (30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={pnlData}>
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(v) => [`$${v.toFixed(2)}`, 'Cumulative P&L']}
            />
            <Line type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Bots */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Active Bots</h3>
          <div className="space-y-3">
            {bots.length === 0 ? (
              <p className="text-gray-400 text-sm">No active bots</p>
            ) : (
              bots.map((bot) => (
                <div key={bot.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">{bot.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${strategyColors[bot.strategy] || 'bg-gray-600 text-gray-300'}`}>
                        {bot.strategy}
                      </span>
                      <span className="text-xs text-gray-400">{bot.pair}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${bot.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {bot.total_profit >= 0 ? '+' : ''}${bot.total_profit.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-xs text-green-400">Active</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="pb-3">Pair</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Entry</th>
                  <th className="pb-3 text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr><td colSpan="4" className="text-gray-400 py-4 text-center">No recent trades</td></tr>
                ) : (
                  trades.map((trade) => (
                    <tr key={trade.id} className="border-t border-gray-700">
                      <td className="py-2.5 text-white">{trade.pair}</td>
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {trade.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-300">{trade.entry_price}</td>
                      <td className={`py-2.5 text-right font-medium ${trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
