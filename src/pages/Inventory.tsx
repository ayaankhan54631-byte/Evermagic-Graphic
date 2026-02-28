import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Package, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export const Inventory = () => {
  const { getAuthHeaders } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [newItem, setNewItem] = useState({
    material: '',
    stock_sqft: '',
    min_stock: 100,
    rate: '',
    buy_rate: '',
    is_for_sale: true,
    unit: 'sqft'
  });

  const [updateData, setUpdateData] = useState({
    material: '',
    stock_sqft: '',
    min_stock: '',
    rate: '',
    buy_rate: '',
    is_for_sale: true,
    unit: 'sqft'
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`/api/inventory`, getAuthHeaders());
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/inventory`, {
        ...newItem,
        stock_sqft: parseFloat(newItem.stock_sqft),
        min_stock: parseFloat(newItem.min_stock as any),
        rate: parseFloat(newItem.rate),
        buy_rate: parseFloat(newItem.buy_rate)
      }, getAuthHeaders());
      toast.success('Inventory item added');
      setShowAddModal(false);
      setNewItem({ material: '', stock_sqft: '', min_stock: 100, rate: '', buy_rate: '', is_for_sale: true });
      fetchInventory();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add item');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const updatePayload: any = {
        material: updateData.material,
        is_for_sale: updateData.is_for_sale,
        unit: updateData.unit
      };
      if (updateData.stock_sqft) updatePayload.stock_sqft = parseFloat(updateData.stock_sqft);
      if (updateData.min_stock) updatePayload.min_stock = parseFloat(updateData.min_stock);
      if (updateData.rate) updatePayload.rate = parseFloat(updateData.rate);
      if (updateData.buy_rate) updatePayload.buy_rate = parseFloat(updateData.buy_rate);

      await axios.patch(`/api/inventory/${selectedItem.id}`, updatePayload, getAuthHeaders());
      toast.success('Inventory updated');
      setShowUpdateModal(false);
      setSelectedItem(null);
      setUpdateData({ material: '', stock_sqft: '', min_stock: '', rate: '', buy_rate: '', is_for_sale: true });
      fetchInventory();
    } catch (error) {
      toast.error('Failed to update inventory');
    }
  };

  const openUpdateModal = (item) => {
    setSelectedItem(item);
    setUpdateData({
      material: item.material,
      stock_sqft: item.stock_sqft.toString(),
      min_stock: item.min_stock.toString(),
      rate: item.rate.toString(),
      buy_rate: (item.buy_rate || 0).toString(),
      is_for_sale: !!item.is_for_sale,
      unit: item.unit || 'sqft'
    });
    setShowUpdateModal(true);
  };

  const getStockStatus = (current, min) => {
    const percentage = (current / min) * 100;
    if (percentage > 50) return { color: 'green', label: 'Good Stock' };
    if (percentage > 20) return { color: 'yellow', label: 'Low Stock' };
    return { color: 'red', label: 'Critical' };
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
        <h1 className="text-4xl sm:text-5xl font-space font-bold">Inventory</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="neo-button px-6 py-3 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Material</span>
        </button>
      </div>

      {inventory.length === 0 ? (
        <div className="neo-card text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No inventory items yet. Add materials to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item) => {
            const status = getStockStatus(item.stock_sqft, item.min_stock);
            const percentage = Math.min((item.stock_sqft / item.min_stock) * 100, 100);
            
            return (
              <div key={item.id} className="neo-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-space font-bold">{item.material}</h3>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">Material</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white`} style={{ backgroundColor: status.color }}>
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold">Stock Level</span>
                      <span className="font-bold" style={{ color: status.color }}>{status.label}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-black overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: status.color }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Stock:</span>
                    <span className="font-mono font-bold text-lg">{item.stock_sqft.toLocaleString()} {item.unit === 'piece' ? 'pcs' : 'sqft'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Min Stock:</span>
                    <span className="font-mono">{item.min_stock.toLocaleString()} {item.unit === 'piece' ? 'pcs' : 'sqft'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${item.is_for_sale ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.is_for_sale ? 'FOR SALE' : 'INTERNAL USE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t-2 border-gray-200">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-500">Buy Rate:</span>
                      <div className="font-mono font-bold text-lg">₹{(item.buy_rate || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Sell Rate:</span>
                      <div className="font-mono font-bold text-lg text-brand-cyan">₹{item.rate.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openUpdateModal(item)}
                  className="neo-button-secondary w-full mt-4 py-2"
                >
                  Update Stock
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="neo-card max-w-md w-full"
          >
            <h2 className="text-2xl font-space font-bold mb-6">Add Material</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Material Name *</label>
                <input
                  type="text"
                  value={newItem.material}
                  onChange={(e) => setNewItem({ ...newItem, material: e.target.value })}
                  className="neo-input w-full px-4"
                  placeholder="e.g. Cardsheet"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Buy Rate (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.buy_rate}
                    onChange={(e) => setNewItem({ ...newItem, buy_rate: e.target.value })}
                    className="neo-input w-full px-4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Sell Rate (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.rate}
                    onChange={(e) => setNewItem({ ...newItem, rate: e.target.value })}
                    className="neo-input w-full px-4"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Stock ({newItem.unit === 'piece' ? 'Pcs' : 'SqFt'}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.stock_sqft}
                    onChange={(e) => setNewItem({ ...newItem, stock_sqft: e.target.value })}
                    className="neo-input w-full px-4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Unit Type</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="neo-input w-full px-4"
                  >
                    <option value="sqft">SqFt</option>
                    <option value="piece">Piece</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Min Stock *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.min_stock}
                  onChange={(e) => setNewItem({ ...newItem, min_stock: e.target.value })}
                  className="neo-input w-full px-4"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_for_sale"
                  checked={newItem.is_for_sale}
                  onChange={(e) => setNewItem({ ...newItem, is_for_sale: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="is_for_sale" className="text-sm font-bold uppercase tracking-wide cursor-pointer">Available for Sale</label>
              </div>
              <div className="flex space-x-2 pt-4">
                <button type="submit" className="neo-button flex-1 py-3">
                  Add Material
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

      {showUpdateModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="neo-card max-w-md w-full"
          >
            <h2 className="text-2xl font-space font-bold mb-6">Update {selectedItem.material}</h2>
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Material Name</label>
                <input
                  type="text"
                  value={updateData.material}
                  onChange={(e) => setUpdateData({ ...updateData, material: e.target.value })}
                  className="neo-input w-full px-4"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Buy Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={updateData.buy_rate}
                    onChange={(e) => setUpdateData({ ...updateData, buy_rate: e.target.value })}
                    className="neo-input w-full px-4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Sell Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={updateData.rate}
                    onChange={(e) => setUpdateData({ ...updateData, rate: e.target.value })}
                    className="neo-input w-full px-4"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Stock ({updateData.unit === 'piece' ? 'Pcs' : 'SqFt'})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={updateData.stock_sqft}
                    onChange={(e) => setUpdateData({ ...updateData, stock_sqft: e.target.value })}
                    className="neo-input w-full px-4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Unit Type</label>
                  <select
                    value={updateData.unit}
                    onChange={(e) => setUpdateData({ ...updateData, unit: e.target.value })}
                    className="neo-input w-full px-4"
                  >
                    <option value="sqft">SqFt</option>
                    <option value="piece">Piece</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Min Stock</label>
                <input
                  type="number"
                  step="0.01"
                  value={updateData.min_stock}
                  onChange={(e) => setUpdateData({ ...updateData, min_stock: e.target.value })}
                  className="neo-input w-full px-4"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="update_is_for_sale"
                  checked={updateData.is_for_sale}
                  onChange={(e) => setUpdateData({ ...updateData, is_for_sale: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="update_is_for_sale" className="text-sm font-bold uppercase tracking-wide cursor-pointer">Available for Sale</label>
              </div>
              <div className="flex space-x-2 pt-4">
                <button type="submit" className="neo-button flex-1 py-3">
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedItem(null);
                  }}
                  className="neo-button-secondary flex-1 py-3"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
