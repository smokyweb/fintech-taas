import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import client from '../api/client';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/trading/portfolio'),
      client.get('/trading/positions'),
    ]).then(([portRes, posRes]) => {
      setPortfolio(portRes.data);
      setPositions(posRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div></div>;

  const totalUnrealized = positions.reduce((s, p) => s + (p.unrealized_pnl || 0), 0);
  const todayPnl = portfolio?.equity_curve?.[portfolio.equity_curve.length - 1]?.equity - portfolio?.equity_curve?.[portfolio.equity_curve.length - 2]?.equity || 0;

  const pieData = portfolio?.allocation?.map(a => ({ name: a.name, value: a.value })) || [];
  const barData = portfolio?.allocation?.map(a => ({ name: a.pair, profit: a.profit })) || [];

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Value', value: `$${portfolio?.total_value?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}` },
          { label: 'Unrealized P&L', value: `$${totalUnrealized.toFixed(2)}`, color: totalUnrealized >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Realized P&L', value: `$${portfolio?.realized_pnl?.toFixed(2) || '0.00'}`, color: (portfolio?.realized_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: "Today's P&L", value: `$${todayPnl.toFixed(2)}`, color: todayPnl >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color || 'text-white'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Allocation</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">P&L by Bot</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Open Positions */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Open Positions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left bg-gray-700">
                <th className="px-4 py-3">Pair</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Current</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3 text-right">Unrealized P&L</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-gray-400">No open positions</td></tr>
              ) : (
                positions.map(p => (
                  <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-white font-medium">{p.pair}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{p.type.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{p.entry_price}</td>
                    <td className="px-4 py-3 text-gray-300">{p.current_price}</td>
                    <td className="px-4 py-3 text-gray-300">{p.quantity}</td>
                    <td className={`px-4 py-3 text-right font-medium ${p.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {p.unrealized_pnl >= 0 ? '+' : ''}${p.unrealized_pnl.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Win Rate', value: '64.2%' },
            { label: 'Avg Trade Duration', value: '4.2 hours' },
            { label: 'Sharpe Ratio', value: '1.84' },
            { label: 'Max Drawdown', value: '-3.2%' },
          ].map(m => (
            <div key={m.label} className="text-center">
              <p className="text-sm text-gray-400 mb-1">{m.label}</p>
              <p className="text-xl font-bold text-white">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
