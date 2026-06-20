import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import useCartStore from '../store/useCartStore';
import useBuildStore from '../store/useBuildStore';
import api from '../api';
import useAuthStore from '../store/useAuthStore';

const Cart = () => {
  const { items, removeItem, fetchCart, reprice, loading, getTotal } = useCartStore();
  const { clearSession } = useBuildStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [outOfStockItems, setOutOfStockItems] = useState([]);

  useEffect(() => {
    reprice();
  }, [reprice]);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    const customBuild = items.find(i => i.type === 'custom_build');
    if (!customBuild) {
      alert('Only custom builds can be checked out via the backend currently.');
      return;
    }

    try {
      await api.post(`/builder/session/${customBuild.id}/proceed/`);
      alert('Order initiated successfully!');
      clearSession();
      // Refetch cart since items might have been moved to order
      await fetchCart();
      navigate('/');
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: '/cart' } });
      } else if (err.response?.data?.out_of_stock_items) {
        setOutOfStockItems(err.response.data.out_of_stock_items);
      } else {
        alert(err.response?.data?.error || 'Failed to proceed to checkout');
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F8F9FA] px-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-3xl font-black text-[#1A1A1A] mb-4">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-8 max-w-md text-center">Looks like you haven't added any Mastercrafted Systems or components to your cart yet.</p>
        <button 
          onClick={() => navigate('/prebuilts')}
          className="bg-[#9E00FF] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#8A00E6] transition-all"
        >
          Explore Systems
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-16 px-6">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-4xl font-black text-[#1A1A1A] mb-2 tracking-tight">Shopping Cart</h1>
        <p className="text-gray-500 mb-10 font-medium">Review your items before proceeding to checkout.</p>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items */}
          <div className="flex-grow space-y-6">
            {items.map((item) => (
              <motion.div 
                key={item.cartItemId}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[24px] p-6 border border-gray-100 flex flex-col sm:flex-row items-center gap-6 shadow-sm"
              >
                <div className="w-24 h-24 bg-[#F8F9FA] rounded-xl flex items-center justify-center p-2 flex-none">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                  )}
                </div>

                <div className="flex-grow text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#9E00FF] mb-1 block">
                    {item.type === 'custom_build' ? 'Custom System' : 'Pre-built System'}
                  </span>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-1">{item.name || 'Custom Build'}</h3>
                  {item.type === 'custom_build' && (
                    <p className="text-sm text-gray-400">Custom configured PC</p>
                  )}
                </div>

                <div className="w-32 text-right flex-none">
                  <p className="text-2xl font-black text-[#1A1A1A]">₹{item.price?.toLocaleString() || '—'}</p>
                </div>

                <button 
                  onClick={() => removeItem(item.cartItemId)}
                  className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex-none"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* order summary */}
          <div className="w-full lg:w-[400px] flex-none">
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 sticky top-24 shadow-sm">
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-6 uppercase tracking-wider text-[13px]">Order Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[15px]">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="font-bold text-[#1A1A1A]">₹{getTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-gray-500 font-medium">Estimated Tax</span>
                  <span className="font-bold text-[#1A1A1A]">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-gray-500 font-medium">Standard Shipping</span>
                  <span className="font-bold text-[#9E00FF] uppercase text-[12px] tracking-wider">Free</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total</span>
                  <span className="text-4xl font-black text-[#1A1A1A]">₹{getTotal().toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-black text-white py-5 rounded-xl font-black text-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-[0.98] mb-4"
              >
                Checkout <ArrowRight className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-2 text-gray-400 mt-6">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Secure encrypted checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {outOfStockItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[24px] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-[#1A1A1A] mb-4">Items Out of Stock</h2>
            <p className="text-gray-500 mb-6">
              The following items in your custom build are currently out of stock. Please remove them or swap them out to proceed with your order.
            </p>
            <ul className="space-y-3 mb-8">
              {outOfStockItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-[#1A1A1A] font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {item}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setOutOfStockItems([])}
              className="w-full bg-[#1A1A1A] text-white py-4 rounded-xl font-bold hover:bg-[#2A2A2A] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
