import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import client from '../api/client';

const coinEmojis = { 'BTC/USD': '₿', 'ETH/USD': 'Ξ', 'SOL/USD': '◎', 'BNB/USD': '♦', 'XRP/USD': '✕' };

export default function CryptoMarket() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyModal, setBuyModal] = useState(null);
  const [buyAmount, setBuyAmount] = useState('');

  const fetchData = () => {
    client.get('/market/crypto').then(r => { setCoins(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleBuy = () => {
    const amount = parseFloat(buyAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    toast.success(`Bought $${amount.toFixed(2)} of ${buyModal.name}`);
    setBuyModal(null);
    setBuyAmount('');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div></div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Cryptocurrency Markets</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {coins.map((coin) => (
          <div key={coin.symbol} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{coinEmojis[coin.symbol] || '●'}</span>
              <div>
                <p className="text-white font-semibold">{coin.name}</p>
                <p className="text-xs text-gray-400">{coin.symbol}</p>
              </div>
            </div>

            <p className="text-2xl font-bold text-white mb-1">
              ${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>

            <span className={`text-sm font-medium ${coin.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {coin.change_24h >= 0 ? '+' : ''}{coin.change_24h}%
            </span>

            <div className="h-16 my-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={coin.sparkline.map((v, i) => ({ i, v }))}>
                  <Line type="monotone" dataKey="v" stroke={coin.change_24h >= 0 ? '#10b981' : '#ef4444'} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
              <span>MCap: ${coin.market_cap_b}B</span>
              <span>Vol: ${coin.volume_24h_b}B</span>
            </div>

            <button onClick={() => setBuyModal(coin)} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition">
              Trade
            </button>
          </div>
        ))}
      </div>

      {/* Buy Modal */}
      {buyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Buy {buyModal.name}</h3>
              <button onClick={() => setBuyModal(null)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Current Price: <span className="text-white font-semibold">${buyModal.price.toLocaleString()}</span></p>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Amount (USD)</label>
              <input type="number" value={buyAmount} onChange={e => setBuyAmount(e.target.value)} placeholder="100" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500" />
            </div>
            {buyAmount && parseFloat(buyAmount) > 0 && (
              <p className="text-sm text-gray-400 mb-4">
                You'll get: <span className="text-white font-semibold">{(parseFloat(buyAmount) / buyModal.price).toFixed(6)} {buyModal.symbol.split('/')[0]}</span>
              </p>
            )}
            <button onClick={handleBuy} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition">
              Execute Trade
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
