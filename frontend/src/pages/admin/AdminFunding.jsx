import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import client from '../../api/client';

export default function AdminFunding() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    const url = filter === 'all' ? '/admin/funding' : `/admin/funding?status=${filter}`;
    client.get(url).then(r => { setRequests(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleAction = async (id, status) => {
    try {
      await client.patch(`/admin/funding/${id}`, { status });
      toast.success(`Request ${status}`);
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
    <div className="space-y-4">
      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
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
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-4 text-gray-400">No funding requests</td></tr>
              ) : (
                requests.map(r => (
                  <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{r.user_name}</p>
                      <p className="text-xs text-gray-400">{r.user_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">${r.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-gray-400 capitalize">{r.method.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {r.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(r.id, 'approved')} className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 px-2 py-1 rounded transition">
                            Approve
                          </button>
                          <button onClick={() => handleAction(r.id, 'rejected')} className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded transition">
                            Reject
                          </button>
                        </div>
                      )}
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
