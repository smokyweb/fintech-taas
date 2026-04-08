import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Zap, LayoutDashboard, Bot, Globe, Bitcoin, PieChart, Wallet, Users, UserCircle, Shield, Menu, X, Bell, DollarSign } from 'lucide-react';
import useAuthStore from '../store/authStore';
import clsx from 'clsx';

const navItems = [
  { label: 'Trading', items: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/bots', icon: Bot, label: 'Trading Bots' },
    { to: '/forex', icon: Globe, label: 'Forex Market' },
    { to: '/crypto', icon: Bitcoin, label: 'Crypto Market' },
    { to: '/portfolio', icon: PieChart, label: 'Portfolio' },
  ]},
  { label: 'Account', items: [
    { to: '/funding', icon: Wallet, label: 'Funding' },
    { to: '/referrals', icon: Users, label: 'Referrals' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ]},
];

const adminItems = {
  label: 'Admin',
  items: [
    { to: '/admin', icon: Shield, label: 'Admin Panel' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/bots', icon: Bot, label: 'Bots' },
    { to: '/admin/funding', icon: Wallet, label: 'Funding Requests' },
  ],
};

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/bots': 'Trading Bots',
  '/forex': 'Forex Market',
  '/crypto': 'Crypto Market',
  '/portfolio': 'Portfolio',
  '/funding': 'Funding',
  '/referrals': 'Referrals',
  '/profile': 'Profile',
  '/admin': 'Admin Panel',
  '/admin/users': 'Manage Users',
  '/admin/bots': 'Manage Bots',
  '/admin/funding': 'Funding Requests',
};

export default function Layout() {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const allNavGroups = user?.role === 'admin' ? [...navItems, adminItems] : navItems;
  const pageTitle = pageTitles[location.pathname] || 'TradeFlow';

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  const tierColors = {
    basic: 'bg-gray-600 text-gray-300',
    silver: 'bg-gray-500 text-white',
    gold: 'bg-yellow-500/20 text-yellow-400',
    platinum: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-500 flex flex-col transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-dark-500">
          <Zap className="h-7 w-7 text-yellow-400" />
          <span className="text-xl font-bold text-white">Trade<span className="text-yellow-400">Flow</span></span>
          <button className="ml-auto lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          {allNavGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="px-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.label}</p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-dark-600 text-white border-l-2 border-green-500'
                        : 'text-gray-400 hover:text-white hover:bg-dark-700 border-l-2 border-transparent'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-dark-500">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full capitalize', tierColors[user?.tier] || tierColors.basic)}>
                {user?.tier}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-dark-800 border-b border-dark-500 h-16 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-green-400 font-semibold">${user.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <button className="text-gray-400 hover:text-white relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-white">
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
