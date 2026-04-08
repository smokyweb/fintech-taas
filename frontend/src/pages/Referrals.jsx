import { useState, useEffect } from 'react';
import { Users, DollarSign, Gift, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';

export default function Referrals() {
  const [data, setData] = useState(null);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      client.get('/referrals'),
      client.get('/referrals/link'),
    ]).then(([refRes, linkRes]) => {
      setData(refRes.data);
      setLink(linkRes.data.link);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const claimRewards = async () => {
    try {
      const res = await client.post('/referrals/claim');
      toast.success(`Claimed $${res.data.claimed}!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to claim');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div></div>;

  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-gray-400">Total Referred</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total_referred || 0}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-400">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-green-400">${stats.total_earned || 0}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-5 w-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Pending Rewards</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">${stats.pending_rewards || 0}</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Your Referral Link</h3>
        <div className="flex items-center gap-2">
          <input readOnly value={link} className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-300 text-sm" />
          <button onClick={copyLink} className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Claim button */}
      {stats.pending_rewards > 0 && (
        <button onClick={claimRewards} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-xl transition text-lg">
          Claim ${stats.pending_rewards} Rewards
        </button>
      )}

      {/* Referred Users */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Referred Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left bg-gray-700">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(!data?.referrals || data.referrals.length === 0) ? (
                <tr><td colSpan="4" className="text-center py-4 text-gray-400">No referrals yet</td></tr>
              ) : (
                data.referrals.map(r => (
                  <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-white">
                      {r.referred_name}
                      <span className="text-gray-500 text-xs ml-2">
                        {r.referred_email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-green-400 font-medium">${r.reward_amount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${r.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
