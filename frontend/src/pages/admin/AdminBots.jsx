import { useState, useEffect } from 'react';
import client from '../../api/client';

const strategyColors = {
  RSI: 'bg-blue-500/20 text-blue-400',
  MACD: 'bg-purple-500/20 text-purple-400',
  Moving_Average: 'bg-cyan-500/20 text-cyan-400',
  Mean_Reversion: 'bg-orange-500/20 text-orange-400',
  Scalping: 'bg-pink-500/20 text-pink-400',
};

const statusColors = {
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  stopped: 'bg-gray-600 text-gray-300',
};

export default function AdminBots() {
  const [bots, setBots] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/admin/bots').then(r => { setBots(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? bots : bots.filter(b => b.status === filter);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['all', 'active', 'paused', 'stopped'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize ${filter === s ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700 text-gray-400 text-left">
                <th className="px-4 py-3">Bot Name</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Strategy</th>
                <th className="px-4 py-3">Pair</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">P&L</th>
                <th className="px-4 py-3">Trades</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-white font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-gray-400">{b.user_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${strategyColors[b.strategy] || 'bg-gray-600 text-gray-300'}`}>{b.strategy}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{b.pair}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[b.status] || statusColors.stopped}`}>{b.status}</span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${b.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {b.total_profit >= 0 ? '+' : ''}${b.total_profit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{b.total_trades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
