import { AlertTriangle, ChevronRight, Zap, ShoppingCart, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const LiveCalculator = ({ currentBuild, onAddToCart, onSaveBuild }) => {
  const isCompatible = currentBuild?.is_compatible;
  const notes = currentBuild?.compatibility_notes || [];

  return (
    <div className="w-full lg:w-[400px] shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 sticky top-28">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
          <h3 className="text-xl font-bold text-[#1A1A1A]">Live Calculator</h3>
          <div className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isCompatible ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            <Zap className="w-3.5 h-3.5" />
            {isCompatible ? 'Compatible' : 'Checking...'}
          </div>
        </div>
        
        <div className="space-y-4 mb-10">
          <div className="flex justify-between items-center text-[15px]">
            <span className="text-gray-500">Base Price</span>
            <span className="font-bold text-[#1A1A1A]">₹{currentBuild?.total_price?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between items-center text-[15px]">
            <span className="text-gray-500">Estimated GST (18%)</span>
            <span className="font-bold text-[#1A1A1A]">Included</span>
          </div>
          <div className="flex justify-between items-center text-[15px]">
            <span className="text-gray-500">Shipping</span>
            <span className="font-bold text-green-600 uppercase text-[13px]">Calculated at checkout</span>
          </div>
          <div className="pt-6 border-t border-gray-50">
            <div className="flex justify-between items-end">
              <span className="text-gray-500 font-medium">Estimated Total</span>
              <span className="text-3xl font-black text-[#9E00FF]">₹{currentBuild?.total_price?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* compatibility alert */}
        {notes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-xl"
          >
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="space-y-2">
                <p className="text-[13px] font-bold text-amber-700">Hardware Notes</p>
                <ul className="space-y-1">
                  {notes.map((note, i) => (
                    <li key={i} className="text-[12px] text-amber-600 leading-tight">• {note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-10">
          <div className="flex justify-between text-[13px] font-bold mb-2 uppercase tracking-wide">
            <span className="text-gray-400">Power Draw</span>
            <span className={currentBuild?.total_wattage > (currentBuild?.psu_wattage || 1000) ? 'text-red-500' : 'text-[#9E00FF]'}>
              {currentBuild?.total_wattage || 0}W / {currentBuild?.psu_wattage || '--'}W
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((currentBuild?.total_wattage / (currentBuild?.psu_wattage || 1000)) * 100, 100)}%` }}
              className={`h-full ${currentBuild?.total_wattage > currentBuild?.psu_wattage ? 'bg-red-500' : 'bg-[#9E00FF]'}`}
            />
          </div>
        </div>

        {/* actions */}
        <div className="space-y-4">
          <button 
            onClick={onAddToCart}
            className="w-full bg-[#9E00FF] text-white py-4 rounded-xl font-bold text-[16px] hover:bg-[#6A23A7] transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-200"
          >
            Proceed to Order <ChevronRight className="w-5 h-5" />
          </button>
          <button 
            onClick={onSaveBuild}
            className="w-full bg-white border-2 border-gray-100 text-gray-700 py-4 rounded-xl font-bold text-[16px] hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
          >
            <Save className="w-5 h-5" /> Save Configuration
          </button>
        </div>

        <p className="mt-8 text-center text-[12px] text-gray-400 leading-relaxed">
          * Prices are subject to change based on real-time availability. Final cost will be confirmed during checkout.
        </p>
      </div>
    </div>
  );
};

export default LiveCalculator;
