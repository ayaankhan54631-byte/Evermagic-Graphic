import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FileText, Search, Plus } from 'lucide-react';
import { motion } from 'motion/react';

export const Orders = () => {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`/api/orders`, getAuthHeaders());
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'designing': return 'bg-yellow-100 text-yellow-700 border-yellow-500';
      case 'completed': return 'bg-green-100 text-green-700 border-green-500';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-500';
      default: return 'bg-gray-100 text-gray-700 border-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-2xl font-space font-bold">Loading...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-4xl sm:text-5xl font-space font-bold">Orders</h1>
        <button
          onClick={() => navigate('/orders/new')}
          className="neo-button px-6 py-3 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Order</span>
        </button>
      </div>

      <div className="neo-card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by customer or order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neo-input w-full pl-12"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="neo-input px-4"
          >
            <option value="all">All Status</option>
            <option value="designing">Designing</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-3 px-4 font-bold uppercase text-sm">Order #</th>
                  <th className="text-left py-3 px-4 font-bold uppercase text-sm">Customer</th>
                  <th className="text-left py-3 px-4 font-bold uppercase text-sm">Material</th>
                  <th className="text-left py-3 px-4 font-bold uppercase text-sm">SqFt</th>
                  <th className="text-left py-3 px-4 font-bold uppercase text-sm">Amount</th>
                  <th className="text-left py-3 px-4 font-bold uppercase text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-bold uppercase text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <td className="py-3 px-4 font-mono font-bold">{order.order_number}</td>
                    <td className="py-3 px-4">{order.customer_name}</td>
                    <td className="py-3 px-4 text-sm">
                      <div>{order.material}</div>
                      {order.unit === 'piece' && <span className="text-[10px] text-gray-400 uppercase">Per Piece</span>}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {order.unit === 'piece' ? `${order.qty} pcs` : `${order.sqft.toFixed(2)} sqft`}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">₹{order.total_amount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
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
