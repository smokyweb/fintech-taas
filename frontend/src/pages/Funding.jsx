import { useState, useEffect } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, X } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import useAuthStore from '../store/authStore';

const METHODS = [
  { id: 'bank_transfer', name: 'Bank Transfer', fee: '0%', icon: '🏦' },
  { id: 'crypto', name: 'Crypto Wallet', fee: '0.5%', icon: '₿' },
  { id: 'card', name: 'Credit Card', fee: '2.5%', icon: '💳' },
];

export default function Funding() {
  const { user, setUser } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'deposit' | 'withdraw'
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');

  const fetchData = () => {
    client.get('/funding').then(r => { setRequests(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }

    try {
      const endpoint = modal === 'deposit' ? '/funding/deposit' : '/funding/withdraw';
      const res = await client.post(endpoint, { amount: amt, method });
      toast.success(res.data.message);
      setUser({ ...user, balance: res.data.balance });
      setModal(null);
      setAmount('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const statusBadge = (s) => {
    const colors = { approved: 'bg-green-500/20 text-green-400', pending: 'bg-yellow-500/20 text-yellow-400', rejected: 'bg-red-500/20 text-red-400' };
    return <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${colors[s] || 'bg-gray-600 text-gray-300'}`}>{s}</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div></div>;

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
        <Wallet className="h-10 w-10 text-green-400 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-1">Available Balance</p>
        <p className="text-4xl font-bold text-white mb-6">${user?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setModal('deposit')} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-lg transition">
            <ArrowDownToLine className="h-4 w-4" /> Deposit
          </button>
          <button onClick={() => setModal('withdraw')} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2.5 rounded-lg transition">
            <ArrowUpFromLine className="h-4 w-4" /> Withdraw
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left bg-gray-700">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4 text-gray-400">No transactions yet</td></tr>
              ) : (
                requests.map(r => (
                  <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-gray-300">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">${r.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-gray-400 capitalize">{r.method.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white capitalize">{modal}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Amount (USD)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500" />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Payment Method</label>
              <div className="space-y-2">
                {METHODS.map(m => (
                  <label key={m.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border ${method === m.id ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-700'}`}>
                    <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-green-500" />
                    <span className="text-lg">{m.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm text-white">{m.name}</p>
                      <p className="text-xs text-gray-400">Fee: {m.fee}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <button onClick={handleSubmit} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition">
              {modal === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
