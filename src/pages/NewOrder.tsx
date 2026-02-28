import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Calculator, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export const NewOrder = () => {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    material: '',
    unit: 'sqft',
    length: '',
    breadth: '',
    qty: 1,
    rate_per_sqft: '',
    pasting_charges: 0,
    led_work: 0,
    frame_charges: 0,
    notes: '',
  });

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const [preview, setPreview] = useState({
    sqft: 0,
    material_amount: 0,
    total_amount: 0,
  });

  useEffect(() => {
    fetchCustomers();
    fetchInventory();
  }, []);

  useEffect(() => {
    if (inventory.length > 0 && !formData.material) {
      const saleableItems = inventory.filter(i => i.is_for_sale);
      if (saleableItems.length > 0) {
        const first = saleableItems[0];
        setFormData(prev => ({ 
          ...prev, 
          material: first.material,
          unit: first.unit || 'sqft',
          rate_per_sqft: first.rate.toString(),
          length: first.material.includes('Cardsheet') ? '1.083' : prev.length,
          breadth: first.material.includes('Cardsheet') ? '1.583' : prev.breadth,
        }));
      }
    }
  }, [inventory, formData.material]);

  useEffect(() => {
    calculatePreview();
  }, [formData.length, formData.breadth, formData.qty, formData.rate_per_sqft, formData.pasting_charges, formData.led_work, formData.frame_charges, formData.unit]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`/api/customers`, getAuthHeaders());
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`/api/inventory`, getAuthHeaders());
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const parseFileName = (name: string) => {
    const clean = name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").toLowerCase();
    
    // Qty
    let qty = 1;
    const qtyMatch = clean.match(/(\d+)\s*print/);
    if (qtyMatch) qty = parseInt(qtyMatch[1]);

    // Size
    const sizeMatch = clean.match(/(\d+(\.\d+)?)\s*x\s*(\d+(\.\d+)?)/);
    if (!sizeMatch) return null;
    let w = parseFloat(sizeMatch[1]);
    let h = parseFloat(sizeMatch[3]);
    if (clean.includes("inch")) { w /= 12; h /= 12; }

    // Flex Material Rate
    let rate = 0;
    let material = "Vinyl";
    
    // Try to find matching material from database inventory
    const matchedInv = inventory.find(inv => clean.includes(inv.material.toLowerCase()));
    if (matchedInv) {
      rate = matchedInv.rate;
      material = matchedInv.material;
    } else {
      // Fallback defaults from HTML
      if (clean.includes("star")) { rate = 10; material = "Star"; }
      else if (clean.includes("china")) { rate = 6; material = "China"; }
      else if (clean.includes("vinyl")) { rate = 25; material = "Vinyl"; }
      else { rate = 6; material = "China"; } // Default
    }

    let pasting = 0;
    if (clean.includes("pasting")) { pasting = 5 * (w * h * qty); }

    // Frame Calculation
    let frameRate = 0;
    if (clean.includes("halki")) frameRate = 10;
    else if (clean.includes("bhari")) frameRate = 15;

    let frameCharges = 0;
    if (frameRate > 0) {
      let perimeter = 2 * (w + h);
      let internalSupportsCount = Math.max(0, Math.ceil(w / 3) - 1);
      let supportLength = internalSupportsCount * h;
      let frameLength = perimeter + supportLength;
      frameCharges = frameLength * frameRate * qty;
    }

    return {
      fileName: name,
      material,
      length: w,
      breadth: h,
      qty,
      rate_per_sqft: rate,
      pasting_charges: pasting,
      frame_charges: frameCharges,
      led_work: 0,
      notes: `Auto-parsed from: ${name}`
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const items: any[] = [];
    (Array.from(files) as any[]).forEach(file => {
      if (!file.name.match(/\.(jpg|jpeg|png|pdf|cdr|ai|psd|tiff)$/i)) return;
      const parsed = parseFileName(file.name);
      if (parsed) {
        items.push(parsed);
      }
    });

    setOrderItems([...orderItems, ...items]);
    toast.success(`Added ${items.length} items from files`);
  };

  const calculatePreview = () => {
    const length = parseFloat(formData.length) || 0;
    const breadth = parseFloat(formData.breadth) || 0;
    const qty = parseInt(formData.qty as any) || 0;
    const rate = parseFloat(formData.rate_per_sqft) || 0;
    const pasting = parseFloat(formData.pasting_charges as any) || 0;
    const led = parseFloat(formData.led_work as any) || 0;
    const frame = parseFloat(formData.frame_charges as any) || 0;

    const sqft = length * breadth * qty;
    const material_amount = formData.unit === 'piece' ? (qty * rate) : (sqft * rate);
    const total_amount = material_amount + pasting + led + frame;

    setPreview({ sqft, material_amount, total_amount });
  };

  const handleCustomerSelect = async (e) => {
    const customerId = e.target.value;
    if (customerId === 'new') {
      setShowNewCustomer(true);
      setFormData({ ...formData, customer_id: '', customer_name: '' });
    } else {
      const customer = customers.find((c) => c.id.toString() === customerId);
      setFormData({ ...formData, customer_id: customerId, customer_name: customer?.name || '' });
      setShowNewCustomer(false);
      
      // Fetch customer specific rates
      try {
        const response = await axios.get(`/api/customers/${customerId}/rates`, getAuthHeaders());
        const customerRates = response.data;
        
        // If current material has a specific rate, apply it
        const specificRate = customerRates.find(r => r.material === formData.material);
        if (specificRate) {
          setFormData(prev => ({ ...prev, rate_per_sqft: specificRate.rate.toString() }));
        } else {
          // Fallback to inventory rate
          const inv = inventory.find(i => i.material === formData.material);
          setFormData(prev => ({ ...prev, rate_per_sqft: inv?.rate || '' }));
        }
      } catch (error) {
        console.error('Error fetching customer rates:', error);
      }
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const response = await axios.post(`/api/customers`, newCustomer, getAuthHeaders());
      const createdCustomer = response.data as any;
      setCustomers([...customers, createdCustomer]);
      setFormData({ ...formData, customer_id: createdCustomer.id.toString(), customer_name: createdCustomer.name });
      setShowNewCustomer(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      toast.success('Customer created successfully');
    } catch (error) {
      toast.error('Failed to create customer');
    }
  };

  const addManualItem = () => {
    if (!formData.length || !formData.breadth || !formData.rate_per_sqft) {
      toast.error('Please fill all required fields');
      return;
    }

    const newItem = {
      fileName: 'Manual Entry',
      material: formData.material,
      unit: formData.unit,
      length: parseFloat(formData.length) || 0,
      breadth: parseFloat(formData.breadth) || 0,
      qty: parseInt(formData.qty as any),
      rate_per_sqft: parseFloat(formData.rate_per_sqft),
      pasting_charges: parseFloat(formData.pasting_charges as any) || 0,
      led_work: parseFloat(formData.led_work as any) || 0,
      frame_charges: parseFloat(formData.frame_charges as any) || 0,
      notes: formData.notes
    };

    setOrderItems([...orderItems, newItem]);
    setFormData({
      ...formData,
      length: '',
      breadth: '',
      qty: 1,
      notes: ''
    });
    toast.success('Item added to list');
  };

  const handleSubmit = async () => {
    if (!formData.customer_id || !formData.customer_name) {
      toast.error('Please select or create a customer');
      return;
    }

    if (orderItems.length === 0) {
      toast.error('No items in the list');
      return;
    }

    try {
      await axios.post(`/api/orders/bulk`, {
        customer_id: formData.customer_id,
        customer_name: formData.customer_name,
        items: orderItems
      }, getAuthHeaders());
      toast.success('Orders created successfully');
      navigate('/orders');
    } catch (error) {
      toast.error('Failed to create orders');
    }
  };

  const updateItemRate = (index: number, newRate: string) => {
    const updatedItems = [...orderItems];
    updatedItems[index].rate_per_sqft = parseFloat(newRate) || 0;
    setOrderItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const totalAmount = orderItems.reduce((sum, item) => {
    const sqft = item.length * item.breadth * item.qty;
    const material_amount = item.unit === 'piece' ? (item.qty * item.rate_per_sqft) : (sqft * item.rate_per_sqft);
    return sum + material_amount + item.pasting_charges + item.frame_charges + item.led_work;
  }, 0);

  const totalSqFt = orderItems.reduce((sum, item) => {
    return sum + (item.length * item.breadth * item.qty);
  }, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/orders')}
            className="neo-button-secondary px-4 py-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-4xl sm:text-5xl font-space font-bold">New Order</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {orderItems.length > 0 && (
            <button 
              onClick={() => {
                if(confirm('Clear all items?')) setOrderItems([]);
              }}
              className="neo-button-secondary px-4 py-3 text-red-500 border-red-500"
            >
              Clear List
            </button>
          )}
          <label className="neo-button px-6 py-3 cursor-pointer flex items-center space-x-2 bg-brand-magenta shadow-[4px_4px_0px_0px_#000]">
            <Plus className="w-5 h-5" />
            <span>Bulk Upload Files</span>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleFileUpload}
              accept=".jpg,.jpeg,.png,.pdf,.cdr,.ai,.psd,.tiff"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="neo-card">
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Customer</label>
            {!showNewCustomer ? (
              <div className="flex space-x-2">
                <select
                  value={formData.customer_id}
                  onChange={handleCustomerSelect}
                  className="neo-input flex-1 px-4"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                  <option value="new">+ Add New Customer</option>
                </select>
              </div>
            ) : (
              <div className="space-y-4 p-4 border-2 border-brand-cyan rounded-md">
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="neo-input w-full px-4"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="neo-input w-full px-4"
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleCreateCustomer}
                    className="neo-button px-4 py-2 flex-1"
                  >
                    Create Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(false)}
                    className="neo-button-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry Form */}
          <div className="neo-card space-y-6">
            <h2 className="text-2xl font-space font-bold flex items-center gap-2">
              <Plus className="w-6 h-6" />
              Add Item Manually
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Material</label>
                <select
                  value={formData.material}
                  onChange={async (e) => {
                    const mat = e.target.value;
                    let rate = '';
                    const inv = inventory.find(i => i.material === mat);
                    const unit = inv?.unit || 'sqft';
                    
                    // Check if customer is selected and has specific rate
                    if (formData.customer_id) {
                      try {
                        const response = await axios.get(`/api/customers/${formData.customer_id}/rates`, getAuthHeaders());
                        const specificRate = response.data.find(r => r.material === mat);
                        if (specificRate) {
                          rate = specificRate.rate.toString();
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }
                    
                    if (!rate) {
                      rate = inv?.rate || '';
                    }
                    
                    setFormData({ 
                      ...formData, 
                      material: mat, 
                      unit: unit,
                      rate_per_sqft: rate,
                      length: mat.includes('Cardsheet') ? '1.083' : formData.length,
                      breadth: mat.includes('Cardsheet') ? '1.583' : formData.breadth,
                    });
                  }}
                  className="neo-input w-full px-4"
                  disabled={inventory.length === 0}
                >
                  {inventory.length === 0 ? (
                    <option>Loading materials...</option>
                  ) : (
                    inventory.filter(i => i.is_for_sale).map((item) => (
                      <option key={item.id} value={item.material}>
                        {item.material} (₹{item.rate})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Rate (₹ / {formData.unit})</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate_per_sqft}
                  onChange={(e) => setFormData({ ...formData, rate_per_sqft: e.target.value })}
                  className="neo-input w-full px-4"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Length (ft)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  className="neo-input w-full px-4"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Breadth (ft)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.breadth}
                  onChange={(e) => setFormData({ ...formData, breadth: e.target.value })}
                  className="neo-input w-full px-4"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Qty</label>
                <input
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value as any })}
                  className="neo-input w-full px-4"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Pasting (₹)</label>
                <input
                  type="number"
                  value={formData.pasting_charges}
                  onChange={(e) => setFormData({ ...formData, pasting_charges: e.target.value as any })}
                  className="neo-input w-full px-4"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">LED (₹)</label>
                <input
                  type="number"
                  value={formData.led_work}
                  onChange={(e) => setFormData({ ...formData, led_work: e.target.value as any })}
                  className="neo-input w-full px-4"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Frame (₹)</label>
                <input
                  type="number"
                  value={formData.frame_charges}
                  onChange={(e) => setFormData({ ...formData, frame_charges: e.target.value as any })}
                  className="neo-input w-full px-4"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addManualItem}
              className="neo-button w-full py-3 bg-brand-yellow text-black shadow-[4px_4px_0px_0px_#000]"
            >
              Add to Order List
            </button>
          </div>

          {/* Order Items List */}
          <div className="neo-card">
            <h2 className="text-2xl font-space font-bold mb-6 flex items-center justify-between">
              Order Items ({orderItems.length})
              {orderItems.length > 0 && (
                <span className="text-brand-cyan font-mono text-xl">₹{totalAmount.toLocaleString()}</span>
              )}
            </h2>

            {orderItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No items added yet. Use manual entry or bulk upload.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-black">
                        <th className="text-left py-2 px-2 font-bold uppercase">Details</th>
                        <th className="text-left py-2 px-2 font-bold uppercase">Size/Qty</th>
                        <th className="text-left py-2 px-2 font-bold uppercase">Rate (₹)</th>
                        <th className="text-right py-2 px-2 font-bold uppercase">Total</th>
                        <th className="py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, idx) => {
                        const sqft = item.length * item.breadth * item.qty;
                        const material_amount = item.unit === 'piece' ? (item.qty * item.rate_per_sqft) : (sqft * item.rate_per_sqft);
                        const total = material_amount + item.pasting_charges + item.frame_charges + item.led_work;
                        return (
                          <tr key={idx} className="border-b border-gray-100 group">
                            <td className="py-3 px-2">
                              <div className="font-bold">{item.material}</div>
                              <div className="text-[10px] text-gray-500">Unit: {item.unit}</div>
                              <div className="text-[10px] text-gray-500 truncate max-w-[120px]">{item.fileName}</div>
                            </td>
                            <td className="py-3 px-2 font-mono">
                              {item.length}x{item.breadth} <span className="text-gray-400">×</span> {item.qty}
                            </td>
                            <td className="py-3 px-2">
                              <input 
                                type="number"
                                value={item.rate_per_sqft}
                                onChange={(e) => updateItemRate(idx, e.target.value)}
                                className="w-20 border-b border-dashed border-gray-300 focus:border-black outline-none font-mono"
                              />
                            </td>
                            <td className="py-3 px-2 text-right font-mono font-bold">₹{total.toLocaleString()}</td>
                            <td className="py-3 px-2 text-right">
                              <button 
                                onClick={() => removeItem(idx)}
                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <button
                  onClick={handleSubmit}
                  className="neo-button w-full py-4 text-xl bg-brand-cyan mt-6"
                >
                  Create Order with {orderItems.length} Items
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1">
          <div className="neo-card sticky top-20">
            <div className="flex items-center space-x-2 mb-6">
              <Calculator className="w-6 h-6" />
              <h2 className="text-2xl font-space font-bold">Summary</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b-2 border-gray-200">
                <span className="font-bold uppercase text-sm">Total Items:</span>
                <span className="text-2xl font-mono font-bold">{orderItems.length}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b-2 border-gray-200">
                <span className="font-bold uppercase text-sm">Total SqFt:</span>
                <span className="text-2xl font-mono font-bold">{totalSqFt.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t-2 border-black">
                <span className="font-bold uppercase text-lg">Grand Total:</span>
                <span className="text-3xl font-mono font-bold text-brand-cyan">₹{totalAmount.toLocaleString()}</span>
              </div>

              <div className="pt-6 space-y-2">
                <p className="text-xs text-gray-500 font-medium uppercase">Quick Tips:</p>
                <ul className="text-[10px] text-gray-400 space-y-1 list-disc pl-4">
                  <li>Add multiple items manually or via upload.</li>
                  <li>Edit rates directly in the table.</li>
                  <li>Click "Create Order" to save everything at once.</li>
                  <li>Data is saved to the central server database.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
