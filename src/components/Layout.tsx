import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Users, Package, UsersRound, LogOut, Printer } from 'lucide-react';

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/orders', icon: FileText, label: 'Orders' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/inventory', icon: Package, label: 'Inventory', adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b-2 border-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black text-brand-yellow rounded-lg flex items-center justify-center">
                <Printer className="w-6 h-6" />
              </div>
              <span className="text-2xl font-space font-bold hidden sm:block">Evermagic Graphic</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md font-bold uppercase text-sm tracking-wide transition-colors ${
                      isActive 
                        ? 'bg-black text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex items-center space-x-2 text-[10px] font-bold uppercase text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Server Synced</span>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold font-mono">{user?.username}</div>
                <div className="text-xs text-gray-600 uppercase">{user?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="neo-button-secondary px-4 py-2 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="md:hidden border-t-2 border-gray-200">
          <div className="flex overflow-x-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 flex flex-col items-center py-3 px-2 text-[10px] font-bold ${
                    isActive ? 'bg-black text-white' : 'text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
