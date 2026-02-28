import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Users, Search, Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export const Customers = () => {
  const { getAuthHeaders } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState<any>(null);
  const [customerRates, setCustomerRates] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'retail'
  });

  useEffect(() => {
    fetchData();
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`/api/inventory`, getAuthHeaders());
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [customersRes, ordersRes] = await Promise.all([
        axios.get(`/api/customers`, getAuthHeaders()),
        axios.get(`/api/orders`, getAuthHeaders()),
      ]);
      setCustomers(customersRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const response = await axios.post(`/api/customers`, newCustomer, getAuthHeaders());
      console.log('Customer added response:', response.data);
      toast.success('Customer added successfully');
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', type: 'retail' });
      fetchData();
    } catch (error: any) {
      console.error('Error adding customer:', error);
      const message = error.response?.data?.detail || 'Failed to add customer';
      toast.error(message);
    }
  };

  const fetchCustomerRates = async (customerId) => {
    try {
      const response = await axios.get(`/api/customers/${customerId}/rates`, getAuthHeaders());
      setCustomerRates(response.data);
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  };

  const handleUpdateRate = async (material, rate) => {
    try {
      await axios.post(`/api/customers/${showRatesModal.id}/rates`, { material, rate: parseFloat(rate) }, getAuthHeaders());
      fetchCustomerRates(showRatesModal.id);
      toast.success('Rate updated');
    } catch (error) {
      toast.error('Failed to update rate');
    }
  };

  const getCustomerStats = (customerId) => {
    const customerOrders = orders.filter((o) => o.customer_id === customerId);
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalDue = customerOrders.reduce((sum, o) => sum + o.payment_due, 0);
    return { totalOrders, totalSpent, totalDue };
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-4xl sm:text-5xl font-space font-bold">Customers</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="neo-button px-6 py-3 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="neo-card">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="neo-input w-full pl-12"
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No customers found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => {
              const stats = getCustomerStats(customer.id);
              return (
                <div
                  key={customer.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-brand-cyan hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{customer.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${customer.type === 'wholesale' ? 'bg-purple-100 text-purple-700 border-purple-500' : 'bg-blue-100 text-blue-700 border-blue-500'}`}>
                          {customer.type}
                        </span>
                      </div>
                      {customer.phone && (
                        <p className="text-sm text-gray-600 font-mono">{customer.phone}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        setShowRatesModal(customer);
                        fetchCustomerRates(customer.id);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Manage Rates"
                    >
                      <Settings className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="pt-3 border-t-2 border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Orders:</span>
                      <span className="font-bold font-mono">{stats.totalOrders}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="font-bold font-mono text-green-600">₹{stats.totalSpent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Due:</span>
                      <span className="font-bold font-mono text-red-600">₹{stats.totalDue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="neo-card max-w-md w-full"
          >
            <h2 className="text-2xl font-space font-bold mb-6">Add New Customer</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Name *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="neo-input w-full px-4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Type</label>
                  <select
                    value={newCustomer.type}
                    onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value })}
                    className="neo-input w-full px-4"
                  >
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Phone</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="neo-input w-full px-4"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="neo-input w-full px-4"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Address</label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="neo-input w-full px-4 min-h-[80px] py-2"
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <button type="submit" className="neo-button flex-1 py-3">
                  Add Customer
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="neo-button-secondary flex-1 py-3"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showRatesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="neo-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-space font-bold">Rates for {showRatesModal.name}</h2>
              <button 
                onClick={() => setShowRatesModal(null)}
                className="text-3xl font-bold hover:text-red-500"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Set custom rates for this customer. These will override the default inventory rates.</p>
              
              <div className="grid grid-cols-1 gap-2">
                {inventory.filter(i => i.is_for_sale).map(item => {
                  const currentRate = customerRates.find(r => r.material === item.material)?.rate || '';
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 border-2 border-gray-100 rounded-lg">
                      <span className="font-bold">{item.material}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">₹</span>
                        <input 
                          type="number"
                          placeholder={`Default: ${item.rate}`}
                          defaultValue={currentRate}
                          onBlur={(e) => {
                            if (e.target.value !== currentRate.toString()) {
                              handleUpdateRate(item.material, e.target.value);
                            }
                          }}
                          className="w-24 neo-input px-2 py-1 text-right font-mono"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <button
              onClick={() => setShowRatesModal(null)}
              className="neo-button w-full mt-8 py-3"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
