import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, MapPin, Plus, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../store/useCartStore';
import useBuildStore from '../store/useBuildStore';
import api from '../api';
import useAuthStore from '../store/useAuthStore';

// address modal
function AddressModal({ onClose, onSelect }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: 'India', is_default: false,
  });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts/addresses/');
      setAddresses(res.data);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.address_line1 || !form.city || !form.state || !form.postal_code) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/accounts/addresses/', form);
      setCreating(false);
      setForm({ address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: 'India', is_default: false });
      fetchAddresses();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    await api.post(`/accounts/addresses/${id}/set-default/`);
    fetchAddresses();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[24px] p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-[#1A1A1A]">Shipping Address</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="h-16 bg-gray-100 rounded-xl" />
          </div>
        ) : (
          <>
            {addresses.length > 0 && !creating && (
              <div className="space-y-3 mb-6">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="flex items-start gap-4 border border-gray-200 rounded-2xl p-4 cursor-pointer hover:border-[#9E00FF] transition-colors group"
                    onClick={() => onSelect(addr)}
                  >
                    <MapPin className="w-5 h-5 text-[#9E00FF] mt-0.5 flex-none" />
                    <div className="flex-grow text-sm">
                      <p className="font-bold text-[#1A1A1A]">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="text-gray-500">{addr.address_line2}</p>}
                      <p className="text-gray-500">{addr.city}, {addr.state} {addr.postal_code}</p>
                      <p className="text-gray-400">{addr.country}</p>
                      {addr.is_default && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-black uppercase tracking-widest text-[#9E00FF]">
                          <Check className="w-3 h-3" /> Default
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-none items-end">
                      <button
                        className="text-[11px] text-white bg-[#9E00FF] px-3 py-1.5 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); onSelect(addr); }}
                      >
                        Use
                      </button>
                      {!addr.is_default && (
                        <button
                          className="text-[11px] text-gray-400 hover:text-[#9E00FF] font-bold transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleSetDefault(addr.id); }}
                        >
                          Set default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {creating ? (
              <form onSubmit={handleCreate} className="space-y-4">
                {formError && <p className="text-red-500 text-sm font-medium">{formError}</p>}
                {[
                  ['address_line1', 'Address Line 1 *', 'text'],
                  ['address_line2', 'Address Line 2', 'text'],
                  ['city', 'City *', 'text'],
                  ['state', 'State *', 'text'],
                  ['postal_code', 'Postal Code *', 'text'],
                  ['country', 'Country', 'text'],
                ].map(([field, label, type]) => (
                  <div key={field}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</label>
                    <input
                      type={type}
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#9E00FF] transition-colors"
                    />
                  </div>
                ))}
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                    className="accent-[#9E00FF]"
                  />
                  Set as default address
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="flex-1 border border-gray-200 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#9E00FF] text-white py-3 rounded-xl font-bold hover:bg-[#8A00E6] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save Address'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 py-4 rounded-2xl text-sm font-bold text-gray-500 hover:border-[#9E00FF] hover:text-[#9E00FF] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add New Address
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Order confirmation overlay
// ─────────────────────────────────────────────────────
function OrderConfirmed({ orderId, total, onClose }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-3xl font-black text-[#1A1A1A] mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-1 text-sm">Order ID: <span className="font-mono text-xs">{orderId}</span></p>
        <p className="text-gray-500 mb-8 text-sm">Total charged: <span className="font-bold text-[#1A1A1A]">&#8377;{total?.toLocaleString()}</span></p>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-black text-white py-4 rounded-xl font-black text-lg hover:bg-gray-900 transition-all"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main Cart component
// ─────────────────────────────────────────────────────
const Cart = () => {
  const { items, removeItem, fetchCart, reprice, getTotal } = useCartStore();
  const { clearSession } = useBuildStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => { reprice(); }, [reprice]);

  const customBuild = items.find((i) => i.type === 'custom_build');

  // Step 1: Proceed (validate build) then open address picker
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    if (!customBuild) {
      alert('Only custom builds can be checked out currently.');
      return;
    }
    setOrderError(null);
    try {
      await api.post(`/builder/session/${customBuild.id}/proceed/`);
      setShowAddressModal(true);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: '/cart' } });
      } else {
        setOrderError(err.response?.data?.error || 'Failed to validate build. Check your selection.');
      }
    }
  };

  // Step 2: Place order after address selected
  const handlePlaceOrder = async (address) => {
    setShowAddressModal(false);
    setSelectedAddress(address);
    setPlacingOrder(true);
    setOrderError(null);
    try {
      const res = await api.post('/orders/place/', {
        session_id: customBuild.id,
        address_id: address.id,
      });
      clearSession();
      await fetchCart();
      setConfirmedOrder(res.data);
    } catch (err) {
      const data = err.response?.data || {};
      if (data.error === 'INSUFFICIENT_STOCK') {
        setOutOfStockItems(data.out_of_stock || []);
      } else {
        setOrderError(data.error || 'Order failed. Please try again.');
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  if (items.length === 0 && !confirmedOrder) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F8F9FA] px-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-3xl font-black text-[#1A1A1A] mb-4">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-8 max-w-md text-center">Looks like you haven&apos;t added any systems yet.</p>
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
      {/* Confirmed order overlay */}
      {confirmedOrder && (
        <OrderConfirmed
          orderId={confirmedOrder.order_id}
          total={confirmedOrder.total}
          onClose={() => setConfirmedOrder(null)}
        />
      )}

      {/* Address picker modal */}
      <AnimatePresence>
        {showAddressModal && (
          <AddressModal
            onClose={() => setShowAddressModal(false)}
            onSelect={handlePlaceOrder}
          />
        )}
      </AnimatePresence>

      {/* Out of stock modal */}
      {outOfStockItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[24px] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-[#1A1A1A] mb-4">Items Out of Stock</h2>
            <p className="text-gray-500 mb-6">
              The following components are currently out of stock. Please swap them out to continue.
            </p>
            <ul className="space-y-3 mb-8">
              {outOfStockItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-[#1A1A1A] font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
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

      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-4xl font-black text-[#1A1A1A] mb-2 tracking-tight">Shopping Cart</h1>
        <p className="text-gray-500 mb-10 font-medium">Review your items before proceeding to checkout.</p>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart items */}
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
                  <p className="text-2xl font-black text-[#1A1A1A]">&#8377;{item.price?.toLocaleString() || '—'}</p>
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

          {/* Order summary sidebar */}
          <div className="w-full lg:w-[400px] flex-none">
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 sticky top-24 shadow-sm">
              <h3 className="text-[13px] font-bold text-[#1A1A1A] mb-6 uppercase tracking-wider">Order Summary</h3>

              {selectedAddress && (
                <div className="flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-6">
                  <MapPin className="w-4 h-4 text-[#9E00FF] mt-0.5 flex-none" />
                  <div className="text-sm">
                    <p className="font-bold text-[#1A1A1A]">{selectedAddress.address_line1}</p>
                    <p className="text-gray-500">{selectedAddress.city}, {selectedAddress.state}</p>
                  </div>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="ml-auto text-xs text-[#9E00FF] font-bold hover:underline"
                  >
                    Change
                  </button>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[15px]">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="font-bold text-[#1A1A1A]">&#8377;{getTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-gray-500 font-medium">Assembly</span>
                  <span className="font-bold text-[#1A1A1A]">&#8377;350</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-gray-500 font-medium">Tax (8%)</span>
                  <span className="font-bold text-[#1A1A1A]">Calculated at checkout</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total</span>
                  <span className="text-4xl font-black text-[#1A1A1A]">&#8377;{getTotal().toLocaleString()}</span>
                </div>
              </div>

              {orderError && (
                <p className="text-red-500 text-sm font-medium mb-4 text-center">{orderError}</p>
              )}

              <button
                onClick={handleCheckout}
                disabled={placingOrder}
                className="w-full bg-black text-white py-5 rounded-xl font-black text-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-[0.98] mb-4 disabled:opacity-50"
              >
                {placingOrder ? 'Placing Order…' : 'Checkout'} <ArrowRight className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-2 text-gray-400 mt-6">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Secure encrypted checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
