import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, CreditCard, ShieldCheck, ArrowRight, Truck, Settings } from 'lucide-react';
import useBuildStore from '../store/useBuildStore';
import useCartStore from '../store/useCartStore';
import api from '../api';

const SummaryPage = () => {
  const { currentBuild, sessionSecret, clearSession } = useBuildStore();
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  const handleProceed = async () => {
    if (!currentBuild) return;
    
    addItem({
      id: currentBuild.id,
      type: 'custom_build',
      name: 'Custom Singular System',
      price: currentBuild.total_price || 0,
      image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&q=80&w=400',
      specs: {
        cpu: currentBuild.intel_cpu?.name || currentBuild.amd_cpu?.name,
        gpu: currentBuild.gpu?.name,
        ram: currentBuild.ram?.name
      }
    });
    
    clearSession();
    navigate('/cart');
  };

  if (!currentBuild) return <div className="text-center py-32">No build session found.</div>;

  const selections = useMemo(() => {
    if (!currentBuild) return [];
    
    const flatMapping = [
      { key: 'intel_cpu', label: 'CPU' },
      { key: 'amd_cpu', label: 'CPU' },
      { key: 'gpu', label: 'GPU' },
      { key: 'intel_motherboard', label: 'Motherboard' },
      { key: 'amd_motherboard', label: 'Motherboard' },
      { key: 'ram', label: 'RAM' },
      { key: 'psu', label: 'Power Supply' },
    ];

    const sel = [];
    flatMapping.forEach(({ key, label }) => {
      if (currentBuild[key]) {
        sel.push({ label, item: currentBuild[key] });
      }
    });
    return sel;
  }, [currentBuild]);
  return (
    <div className="bg-[#F8F9FA] min-h-screen">
      <section className="bg-black py-16 px-6 text-white text-center">
        <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight">Review Your Build</h1>
        <p className="text-gray-400 max-w-xl mx-auto">Double check your specifications before we begin crafting your masterpiece.</p>
      </section>

      <div className="mx-auto max-w-[1440px] px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="flex-1">
            <div className="bg-white rounded-[40px] p-12 aspect-square flex items-center justify-center border border-gray-100 shadow-sm sticky top-24">
              <motion.img 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src="/hero_pc_gaming.png" 
                alt="Your Build" 
                className="w-full h-full object-contain drop-shadow-2xl" 
              />
            </div>
          </div>

          {/* build details */}
          <div className="flex-1">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
              <div className="bg-[#F8F9FA] p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#9E00FF]" />
                  Selected Components
                </h3>
              </div>
              
              <div className="divide-y divide-gray-50">
                {selections.map(({ label, item }, index) => (
                  <div key={index} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-[#F8F9FA] rounded-xl flex items-center justify-center text-[10px] font-black uppercase text-gray-400">
                        {label.slice(0, 3)}
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-gray-400 font-black mb-0.5">{label}</p>
                        <p className="text-[#1A1A1A] font-bold text-[15px]">{item.name}</p>
                      </div>
                    </div>
                    <span className="text-[#1A1A1A] font-bold">₹{item.price?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <ServiceCard icon={<Truck className="w-5 h-5" />} title="Free Shipping" desc="Insured transit nationwide" />
              <ServiceCard icon={<Settings className="w-5 h-5" />} title="Expert Assembly" desc="Tuned for peak performance" />
              <ServiceCard icon={<ShieldCheck className="w-5 h-5" />} title="3-Year Warranty" desc="On-site service included" />
              <ServiceCard icon={<CreditCard className="w-5 h-5" />} title="Safe Payment" desc="Secure transaction processing" />
            </div>

            {/* checkout */}
            <div className="bg-black text-white rounded-3xl p-10">
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">₹{currentBuild.total_price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Assembly & Testing</span>
                  <span className="text-[#9E00FF] font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Standard Shipping</span>
                  <span className="text-[#9E00FF] font-bold">FREE</span>
                </div>
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Total Amount</p>
                    <p className="text-4xl font-black text-white">₹{currentBuild.total_price?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleProceed}
                className="w-full bg-[#9E00FF] text-white py-5 rounded-xl font-black text-lg flex items-center justify-center gap-3 hover:bg-[#6A23A7] transition-all active:scale-[0.98]"
              >
                Add to Cart
                <ArrowRight className="w-6 h-6" />
              </button>
              <p className="text-[10px] text-center text-gray-500 mt-6 font-medium">
                By completing this order, you agree to our Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServiceCard = ({ icon, title, desc }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
    <div className="text-[#9E00FF] mb-3">{icon}</div>
    <h4 className="font-bold text-[#1A1A1A] mb-1">{title}</h4>
    <p className="text-xs text-gray-400 font-medium">{desc}</p>
  </div>
);

export default SummaryPage;

