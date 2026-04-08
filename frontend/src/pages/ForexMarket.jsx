import { useState, useEffect } from 'react';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';
import client from '../api/client';

export default function ForexMarket() {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    client.get('/market/forex').then(r => { setPairs(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div></div>;

  // Compute info cards
  const mostVolatile = [...pairs].sort((a, b) => Math.abs(b.change_24h) - Math.abs(a.change_24h))[0];
  const bestSpread = [...pairs].sort((a, b) => a.spread - b.spread)[0];
  const now = new Date();
  const hour = now.getUTCHours();
  const sessions = [];
  if (hour >= 0 && hour < 9) sessions.push('Tokyo');
  if (hour >= 7 && hour < 16) sessions.push('London');
  if (hour >= 13 && hour < 22) sessions.push('New York');
  if (sessions.length === 0) sessions.push('Sydney');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Globe className="h-6 w-6 text-blue-400" />
        <h2 className="text-xl font-bold text-white">Global Forex Market</h2>
        <span className="flex items-center gap-1.5 bg-green-500/20 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          LIVE
        </span>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700 text-gray-400 text-left">
                <th className="px-4 py-3">Pair</th>
                <th className="px-4 py-3">Bid</th>
                <th className="px-4 py-3">Ask</th>
                <th className="px-4 py-3">Spread</th>
                <th className="px-4 py-3">24h Change</th>
                <th className="px-4 py-3">Volume</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((p) => (
                <tr key={p.symbol} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
                  <td className="px-4 py-3 text-white font-medium">{p.symbol}</td>
                  <td className="px-4 py-3 text-gray-300">{p.bid.toFixed(4)}</td>
                  <td className="px-4 py-3 text-gray-300">{p.ask.toFixed(4)}</td>
                  <td className="px-4 py-3 text-gray-400">{p.spread.toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {p.change_24h >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-green-400" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                      <span className={p.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {p.change_24h >= 0 ? '+' : ''}{p.change_24h}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{p.volume?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-1">Sessions Open</p>
          <p className="text-lg font-semibold text-white">{sessions.join(', ')}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-1">Most Volatile Pair</p>
          <p className="text-lg font-semibold text-white">{mostVolatile?.symbol}</p>
          <span className={`text-sm ${Math.abs(mostVolatile?.change_24h) > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
            {mostVolatile?.change_24h >= 0 ? '+' : ''}{mostVolatile?.change_24h}%
          </span>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-1">Best Spread</p>
          <p className="text-lg font-semibold text-white">{bestSpread?.symbol}</p>
          <span className="text-sm text-green-400">{bestSpread?.spread?.toFixed(1)} pips</span>
        </div>
      </div>
    </div>
  );
}
