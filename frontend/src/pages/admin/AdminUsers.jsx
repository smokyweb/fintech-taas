import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';

const tierOptions = ['basic', 'silver', 'gold', 'platinum'];
const kycOptions = ['pending', 'verified', 'rejected'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ tier: '', kyc_status: '' });

  const fetchUsers = (q = '') => {
    client.get(`/admin/users?search=${q}`).then(r => { setUsers(r.data.users); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ tier: u.tier, kyc_status: u.kyc_status });
  };

  const handleUpdate = async () => {
    try {
      await client.patch(`/admin/users/${editUser.id}`, editForm);
      toast.success('User updated');
      setEditUser(null);
      fetchUsers(search);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const tierBadge = (t) => {
    const colors = { basic: 'bg-gray-600 text-gray-300', silver: 'bg-gray-500 text-white', gold: 'bg-yellow-500/20 text-yellow-400', platinum: 'bg-purple-500/20 text-purple-400' };
    return <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${colors[t] || colors.basic}`}>{t}</span>;
  };

  const kycBadge = (s) => {
    const colors = { verified: 'bg-green-500/20 text-green-400', pending: 'bg-yellow-500/20 text-yellow-400', rejected: 'bg-red-500/20 text-red-400' };
    return <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${colors[s] || 'bg-gray-600 text-gray-300'}`}>{s}</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div></div>;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-green-500" />
        </div>
        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition">Search</button>
      </form>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700 text-gray-400 text-left">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">KYC</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Bots</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} onClick={() => openEdit(u)} className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer">
                  <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">{tierBadge(u.tier)}</td>
                  <td className="px-4 py-3">{kycBadge(u.kyc_status)}</td>
                  <td className="px-4 py-3 text-gray-300">${u.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-gray-300">{u.bot_count}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Edit {editUser.name}</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tier</label>
                <select value={editForm.tier} onChange={e => setEditForm({...editForm, tier: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500">
                  {tierOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">KYC Status</label>
                <select value={editForm.kyc_status} onChange={e => setEditForm({...editForm, kyc_status: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500">
                  {kycOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={handleUpdate} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition">Update User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
