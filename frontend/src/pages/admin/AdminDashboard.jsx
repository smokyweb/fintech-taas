import { useState, useEffect } from 'react';
import { Users, Bot, DollarSign, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import client from '../../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/admin/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div></div>;

  const cards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'text-blue-400' },
    { label: 'Active Bots', value: stats?.active_bots || 0, icon: Bot, color: 'text-green-400' },
    { label: 'Total Volume', value: `$${(stats?.total_volume || 0).toLocaleString()}`, icon: DollarSign, color: 'text-yellow-400' },
    { label: 'Pending Funding', value: stats?.pending_funding || 0, icon: Clock, color: 'text-red-400' },
  ];

  // Simulated growth data
  const growthData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    users: Math.floor(10 + i * 8 + Math.random() * 15),
  }));

  const activities = [
    { text: 'New user registration: sarah@example.com', time: '2 hours ago' },
    { text: 'Bot "EUR/USD Scalper" activated by Alex Thompson', time: '4 hours ago' },
    { text: 'Deposit of $5,000 approved', time: '6 hours ago' },
    { text: 'New referral signup via ALEX2024', time: '1 day ago' },
    { text: 'Withdrawal request of $500 pending review', time: '1 day ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{c.label}</span>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={growthData}>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-gray-300">{a.text}</p>
                  <p className="text-xs text-gray-500">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
