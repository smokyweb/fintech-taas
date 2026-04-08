import { useState, useEffect } from 'react';
import { Plus, Play, Pause, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';

const STRATEGIES = ['RSI', 'MACD', 'Moving_Average', 'Mean_Reversion', 'Scalping'];
const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'BTC/USD', 'ETH/USD', 'SOL/USD', 'GC/USD', 'GBP/JPY'];
const RISK_LEVELS = ['low', 'medium', 'high'];

const strategyColors = {
  RSI: 'bg-blue-500/20 text-blue-400',
  MACD: 'bg-purple-500/20 text-purple-400',
  Moving_Average: 'bg-cyan-500/20 text-cyan-400',
  Mean_Reversion: 'bg-orange-500/20 text-orange-400',
  Scalping: 'bg-pink-500/20 text-pink-400',
};

const statusConfig = {
  active: { dot: 'bg-green-500 animate-pulse', text: 'text-green-400', label: 'Active' },
  paused: { dot: 'bg-yellow-500', text: 'text-yellow-400', label: 'Paused' },
  stopped: { dot: 'bg-gray-500', text: 'text-gray-400', label: 'Stopped' },
};

const defaultForm = { name: '', strategy: 'RSI', pair: 'EUR/USD', risk_level: 'medium', allocated_amount: 1000, profit_target: 5, stop_loss: 3 };

export default function TradingBots() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const fetchBots = () => {
    client.get('/bots').then(r => { setBots(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchBots(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await client.patch(`/bots/${editId}`, form);
        toast.success('Bot updated');
      } else {
        await client.post('/bots', form);
        toast.success('Bot created');
      }
      setShowModal(false);
      setEditId(null);
      setForm(defaultForm);
      fetchBots();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleActivate = async (id) => {
    await client.post(`/bots/${id}/activate`);
    toast.success('Bot activated');
    fetchBots();
  };

  const handlePause = async (id) => {
    await client.post(`/bots/${id}/pause`);
    toast.success('Bot paused');
    fetchBots();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this bot?')) return;
    await client.delete(`/bots/${id}`);
    toast.success('Bot deleted');
    fetchBots();
  };

  const openEdit = (bot) => {
    setEditId(bot.id);
    setForm({ name: bot.name, strategy: bot.strategy, pair: bot.pair, risk_level: bot.risk_level, allocated_amount: bot.allocated_amount, profit_target: bot.profit_target, stop_loss: bot.stop_loss });
    setShowModal(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Trading Bots</h2>
          <p className="text-sm text-gray-400">{bots.length} bots configured</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(defaultForm); setShowModal(true); }} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition">
          <Plus className="h-4 w-4" /> Create Bot
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bots.map((bot) => {
          const sc = statusConfig[bot.status] || statusConfig.stopped;
          return (
            <div key={bot.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">{bot.name}</h3>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${sc.dot}`}></span>
                  <span className={`text-xs ${sc.text}`}>{sc.label}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${strategyColors[bot.strategy] || 'bg-gray-600 text-gray-300'}`}>
                  {bot.strategy}
                </span>
                <span className="text-sm text-gray-300">{bot.pair}</span>
                <span className="text-xs text-gray-500 capitalize">| {bot.risk_level} risk</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div>
                  <p className="text-xs text-gray-400">P&L</p>
                  <p className={`text-sm font-semibold ${bot.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {bot.total_profit >= 0 ? '+' : ''}${bot.total_profit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Trades</p>
                  <p className="text-sm font-semibold text-white">{bot.total_trades}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Win Rate</p>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full">
                      <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${(bot.win_rate * 100).toFixed(0)}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-300">{(bot.win_rate * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-4">Allocated: <span className="text-white">${bot.allocated_amount.toLocaleString()}</span></p>

              <div className="flex items-center gap-2">
                {bot.status !== 'active' ? (
                  <button onClick={() => handleActivate(bot.id)} className="flex items-center gap-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1.5 rounded-lg text-sm transition">
                    <Play className="h-3 w-3" /> Start
                  </button>
                ) : (
                  <button onClick={() => handlePause(bot.id)} className="flex items-center gap-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-lg text-sm transition">
                    <Pause className="h-3 w-3" /> Pause
                  </button>
                )}
                <button onClick={() => openEdit(bot)} className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(bot.id)} className="p-1.5 bg-gray-700 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editId ? 'Edit Bot' : 'Create Bot'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Strategy</label>
                <select value={form.strategy} onChange={e => setForm({...form, strategy: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500">
                  {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Pair</label>
                <select value={form.pair} onChange={e => setForm({...form, pair: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500">
                  {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Risk Level</label>
                <div className="flex gap-3">
                  {RISK_LEVELS.map(r => (
                    <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="risk" checked={form.risk_level === r} onChange={() => setForm({...form, risk_level: r})} className="accent-green-500" />
                      <span className="text-sm text-gray-300 capitalize">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount ($)</label>
                  <input type="number" value={form.allocated_amount} onChange={e => setForm({...form, allocated_amount: parseFloat(e.target.value)})} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Profit %</label>
                  <input type="number" value={form.profit_target} onChange={e => setForm({...form, profit_target: parseFloat(e.target.value)})} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Stop Loss %</label>
                  <input type="number" value={form.stop_loss} onChange={e => setForm({...form, stop_loss: parseFloat(e.target.value)})} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500" />
                </div>
              </div>
              <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition">
                {editId ? 'Update Bot' : 'Create Bot'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
