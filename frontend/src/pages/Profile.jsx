import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import useAuthStore from '../store/authStore';

const tiers = [
  { name: 'Basic', maxBots: 3, maxDeposit: '$10,000', features: ['3 Trading Bots', 'Basic Strategies', 'Email Support'] },
  { name: 'Silver', maxBots: 10, maxDeposit: '$50,000', features: ['10 Trading Bots', 'All Strategies', 'Priority Support', 'Market Alerts'] },
  { name: 'Gold', maxBots: 25, maxDeposit: '$200,000', features: ['25 Trading Bots', 'All Strategies', 'Dedicated Manager', 'API Access', 'Custom Indicators'] },
  { name: 'Platinum', maxBots: 'Unlimited', maxDeposit: 'Unlimited', features: ['Unlimited Bots', 'All Strategies', 'VIP Support', 'Full API', 'Custom Strategies', 'Co-location'] },
];

const tierColors = {
  basic: 'border-gray-500 text-gray-400',
  silver: 'border-gray-400 text-gray-300',
  gold: 'border-yellow-500 text-yellow-400',
  platinum: 'border-purple-500 text-purple-400',
};

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await client.patch('/user/profile', { name });
      setUser({ ...user, ...res.data });
      toast.success('Name updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
    setSaving(false);
  };

  const handleSubmitKyc = async () => {
    try {
      await client.post('/user/kyc');
      setUser({ ...user, kyc_status: 'pending' });
      toast.success('KYC submitted for review');
    } catch (err) {
      toast.error('Failed to submit KYC');
    }
  };

  const kycBadge = {
    verified: { icon: CheckCircle, color: 'text-green-400 bg-green-500/20', label: 'Verified' },
    pending: { icon: Clock, color: 'text-yellow-400 bg-yellow-500/20', label: 'Pending Review' },
    rejected: { icon: AlertCircle, color: 'text-red-400 bg-red-500/20', label: 'Rejected' },
  };

  const kyc = kycBadge[user?.kyc_status] || kycBadge.pending;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile card */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-gray-400">{user?.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize border ${tierColors[user?.tier] || tierColors.basic}`}>
              {user?.tier}
            </span>
          </div>
        </div>

        {/* Edit name */}
        <form onSubmit={handleUpdateName} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500" />
          </div>
          <button type="submit" disabled={saving} className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>

      {/* KYC */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">KYC Verification</h3>
        <div className="flex items-center gap-2 mb-4">
          <kyc.icon className={`h-5 w-5 ${kyc.color.split(' ')[0]}`} />
          <span className={`text-sm px-3 py-1 rounded-full ${kyc.color}`}>{kyc.label}</span>
        </div>
        {user?.kyc_status === 'verified' ? (
          <p className="text-sm text-gray-400">Your identity has been verified. Full platform access granted.</p>
        ) : user?.kyc_status === 'pending' ? (
          <p className="text-sm text-gray-400">Your KYC documents are under review. This usually takes 1-2 business days.</p>
        ) : (
          <div>
            <p className="text-sm text-gray-400 mb-3">Submit your identity documents to unlock full platform features.</p>
            <button onClick={handleSubmitKyc} className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition">
              Submit KYC
            </button>
          </div>
        )}
      </div>

      {/* Tier comparison */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account Tiers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map(t => {
            const isActive = user?.tier?.toLowerCase() === t.name.toLowerCase();
            return (
              <div key={t.name} className={`p-4 rounded-xl border ${isActive ? 'border-green-500 bg-green-500/5' : 'border-gray-700'}`}>
                <h4 className={`font-semibold mb-2 ${isActive ? 'text-green-400' : 'text-white'}`}>{t.name}</h4>
                <p className="text-xs text-gray-400 mb-1">Max Bots: {t.maxBots}</p>
                <p className="text-xs text-gray-400 mb-3">Max Deposit: {t.maxDeposit}</p>
                <ul className="space-y-1">
                  {t.features.map(f => (
                    <li key={f} className="text-xs text-gray-300 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" /> {f}
                    </li>
                  ))}
                </ul>
                {isActive && <p className="text-xs text-green-400 mt-2 font-medium">Current Plan</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
