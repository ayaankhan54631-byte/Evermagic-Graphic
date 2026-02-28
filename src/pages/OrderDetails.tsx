import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Printer, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export const OrderDetails = () => {
  const { id } = useParams();
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`/api/orders/${id}`, getAuthHeaders());
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await axios.patch(`/api/orders/${id}/status`, { status }, getAuthHeaders());
      toast.success(`Status updated to ${status}`);
      fetchOrder();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    try {
      await axios.patch(`/api/orders/${id}/payment`, { amount }, getAuthHeaders());
      toast.success('Payment added successfully');
      setPaymentAmount('');
      fetchOrder();
    } catch (error) {
      toast.error('Failed to add payment');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="text-center py-12 text-2xl font-space font-bold">Loading...</div>;
  if (!order) return <div className="text-center py-12 text-2xl font-space font-bold">Order not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/orders')} className="neo-button-secondary px-4 py-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-space font-bold">Order {order.order_number}</h1>
        </div>
        <button onClick={handlePrint} className="neo-button px-6 py-2 flex items-center space-x-2">
          <Printer className="w-5 h-5" />
          <span>Print Invoice</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="neo-card print:shadow-none print:border-black">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-space font-bold mb-1">INVOICE</h2>
                <p className="text-gray-600 font-mono text-sm">{order.order_number}</p>
                <p className="text-gray-600 text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">Evermagic Graphic</h3>
                <p className="text-sm text-gray-600">Print & Signage Solutions</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Bill To:</p>
                <p className="font-bold text-lg">{order.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Status:</p>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase border bg-gray-100">
                  {order.status}
                </span>
              </div>
            </div>

            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-2 font-bold uppercase text-xs">Description</th>
                  <th className="text-right py-2 font-bold uppercase text-xs">Size</th>
                  <th className="text-right py-2 font-bold uppercase text-xs">Qty</th>
                  <th className="text-right py-2 font-bold uppercase text-xs">Rate</th>
                  <th className="text-right py-2 font-bold uppercase text-xs">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-4">
                    <p className="font-bold">{order.material}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Unit: {order.unit}</p>
                  </td>
                  <td className="py-4 text-right font-mono">{order.length} x {order.breadth}</td>
                  <td className="py-4 text-right font-mono">{order.qty}</td>
                  <td className="py-4 text-right font-mono">₹{order.rate_per_sqft}</td>
                  <td className="py-4 text-right font-mono font-bold">
                    ₹{(order.unit === 'piece' ? (order.qty * order.rate_per_sqft) : (order.sqft * order.rate_per_sqft)).toLocaleString()}
                  </td>
                </tr>
                {order.pasting_charges > 0 && (
                  <tr className="border-b border-gray-100">
                    <td colSpan={4} className="py-2 text-right text-sm text-gray-600">Pasting Charges</td>
                    <td className="py-2 text-right font-mono">₹{order.pasting_charges.toLocaleString()}</td>
                  </tr>
                )}
                {order.led_work > 0 && (
                  <tr className="border-b border-gray-100">
                    <td colSpan={4} className="py-2 text-right text-sm text-gray-600">LED Work</td>
                    <td className="py-2 text-right font-mono">₹{order.led_work.toLocaleString()}</td>
                  </tr>
                )}
                {order.frame_charges > 0 && (
                  <tr className="border-b border-gray-100">
                    <td colSpan={4} className="py-2 text-right text-sm text-gray-600">Frame Charges</td>
                    <td className="py-2 text-right font-mono">₹{order.frame_charges.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="pt-6 text-right font-bold uppercase">Grand Total</td>
                  <td className="pt-6 text-right font-bold text-xl font-mono">₹{order.total_amount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            {order.notes && (
              <div className="border-t-2 border-gray-100 pt-4">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Notes:</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 print:hidden">
          <div className="neo-card">
            <h3 className="text-xl font-space font-bold mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Order Status</span>
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => handleUpdateStatus('designing')}
                className={`w-full py-2 rounded-md font-bold uppercase text-xs border-2 ${order.status === 'designing' ? 'bg-yellow-400 border-black' : 'border-gray-200 hover:border-black'}`}
              >
                Designing
              </button>
              <button 
                onClick={() => handleUpdateStatus('in_progress')}
                className={`w-full py-2 rounded-md font-bold uppercase text-xs border-2 ${order.status === 'in_progress' ? 'bg-blue-400 border-black' : 'border-gray-200 hover:border-black'}`}
              >
                In Progress
              </button>
              <button 
                onClick={() => handleUpdateStatus('completed')}
                className={`w-full py-2 rounded-md font-bold uppercase text-xs border-2 ${order.status === 'completed' ? 'bg-green-400 border-black' : 'border-gray-200 hover:border-black'}`}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="neo-card">
            <h3 className="text-xl font-space font-bold mb-4 flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Payment Details</span>
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold font-mono">₹{order.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Received:</span>
                <span className="font-bold font-mono text-green-600">₹{order.payment_received.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg border-t-2 border-gray-100 pt-2">
                <span className="font-bold">Due:</span>
                <span className="font-bold font-mono text-red-600">₹{order.payment_due.toLocaleString()}</span>
              </div>
            </div>

            {order.payment_due > 0 && (
              <form onSubmit={handleAddPayment} className="space-y-3">
                <input
                  type="number"
                  placeholder="Payment Amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="neo-input w-full px-4 text-sm"
                />
                <button type="submit" className="neo-button w-full py-2 text-sm">
                  Add Payment
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
