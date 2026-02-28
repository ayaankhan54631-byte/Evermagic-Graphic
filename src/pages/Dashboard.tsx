import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { DollarSign, FileText, AlertCircle, Package, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export const Dashboard = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        axios.get(`/api/dashboard/stats`, getAuthHeaders()),
        axios.get(`/api/orders`, getAuthHeaders())
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-2xl font-space font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  const statCards = [
    {
      label: "Today's Revenue",
      value: `₹${stats?.total_revenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'brand-cyan',
      adminOnly: true,
    },
    {
      label: "Today's Orders",
      value: stats?.total_orders || 0,
      icon: FileText,
      color: 'brand-magenta',
    },
    {
      label: 'Pending Orders',
      value: stats?.pending_orders || 0,
      icon: Clock,
      color: 'brand-yellow',
    },
    {
      label: 'Total Payment Due',
      value: `₹${stats?.total_due?.toLocaleString() || 0}`,
      icon: AlertCircle,
      color: 'red-500',
      adminOnly: true,
    },
    {
      label: "Today's Received",
      value: `₹${stats?.total_received?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'green-500',
      adminOnly: true,
    },
    {
      label: 'Low Stock Items',
      value: stats?.low_stock_count || 0,
      icon: Package,
      color: 'orange-500',
      adminOnly: true,
    },
  ];

  const filteredStatCards = statCards.filter(card => !card.adminOnly || isAdmin);

  const getStatusColor = (status) => {
    switch (status) {
      case 'designing': return 'bg-yellow-100 text-yellow-700 border-yellow-500';
      case 'completed': return 'bg-green-100 text-green-700 border-green-500';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-500';
      default: return 'bg-gray-100 text-gray-700 border-gray-500';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-4xl sm:text-5xl font-space font-bold">Dashboard</h1>
        <button
          onClick={() => navigate('/orders/new')}
          className="neo-button px-6 py-3"
        >
          + New Order
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStatCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="neo-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-space font-bold font-mono">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white`} style={{ backgroundColor: stat.color.startsWith('brand') ? `var(--color-${stat.color})` : stat.color }}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="neo-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-space font-bold">Recent Orders</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-sm font-bold text-brand-cyan hover:text-brand-magenta uppercase"
          >
            View All →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No orders yet. Create your first order!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-3 px-4 font-bold uppercase text-sm">Order #</th>
                  <th className="text-left py-3 px-4 font-bold uppercase text-sm">Customer</th>
                  <th className="text-left py-3 px-4 font-bold uppercase text-sm">Material</th>
                  <th className="text-left py-3 px-4 font-bold uppercase text-sm">Amount</th>
                  <th className="text-left py-3 px-4 font-bold uppercase text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <td className="py-3 px-4 font-mono font-bold">{order.order_number}</td>
                    <td className="py-3 px-4">{order.customer_name}</td>
                    <td className="py-3 px-4">{order.material}</td>
                    <td className="py-3 px-4 font-mono font-bold">₹{order.total_amount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};
