import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, ShieldCheck, Zap, Cpu, Gauge, Box, ArrowLeft } from 'lucide-react';
import api from '../api';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get('/builder/prebuilt/');
      const found = response.data.find(p => p.id.toString() === id);
      setProduct(found || response.data[0]); // demo fallback
    } catch (error) {
      console.error('Failed to fetch product', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-32">Loading specifications...</div>;
  if (!product) return <div className="text-center py-32">Product not found.</div>;

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="mx-auto max-w-[1440px] px-6 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-black font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Collection
        </button>
      </div>

      <section className="mx-auto max-w-[1440px] px-6 flex flex-col lg:flex-row gap-16 mb-24">
        <div className="flex-1">
          <div className="bg-[#F8F9FA] rounded-[40px] p-12 flex items-center justify-center aspect-square border border-gray-100 shadow-sm">
            <motion.img 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={product.image || "/hero_pc_gaming.png"} 
              alt={product.name} 
              className="w-full h-full object-contain drop-shadow-2xl" 
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-10">
            <span className="text-[#9E00FF] font-black uppercase tracking-widest text-sm mb-4 block">Signature Series</span>
            <h1 className="text-5xl font-black text-[#1A1A1A] mb-4">{product.name}</h1>
            <p className="text-3xl font-bold text-[#9E00FF]">₹{product.price?.toLocaleString()}</p>
          </div>

          <p className="text-gray-500 text-lg leading-relaxed mb-10">
            The {product.name} is a masterpiece of modern engineering, designed to provide a seamless experience for both competitive gaming and heavy-duty creative tasks. Every component is hand-picked for peak compatibility.
          </p>

          <div className="grid grid-cols-2 gap-6 mb-12">
            <Highlight icon={<Cpu className="w-6 h-6" />} label="CPU" val={product.cpu_name || 'High-end Core'} />
            <Highlight icon={<Gauge className="w-6 h-6" />} label="GPU" val={product.gpu_name || 'NVIDIA RTX'} />
            <Highlight icon={<Box className="w-6 h-6" />} label="RAM" val="32GB DDR5" />
            <Highlight icon={<ShieldCheck className="w-6 h-6" />} label="Warranty" val="3-Year On-site" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-black text-white py-5 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3">
              <ShoppingCart className="w-6 h-6" /> Add to Cart
            </button>
            <button className="flex-1 bg-white border-2 border-gray-100 text-gray-700 py-5 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all">
              Customize Specs
            </button>
          </div>
        </div>
      </section>

      {/* detailed specs */}
      <section className="bg-[#F8F9FA] py-24 px-6">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-4xl font-bold text-[#1A1A1A] mb-16 text-center">Technical Specifications</h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-50">
                <SpecRow label="Processor" val={product.cpu_name || 'Intel Core i9 13900K'} />
                <SpecRow label="Graphics" val={product.gpu_name || 'NVIDIA GeForce RTX 4090'} />
                <SpecRow label="Motherboard" val="Z790 Premium Series" />
                <SpecRow label="Memory" val="32GB DDR5 6000MHz (2x16GB)" />
                <SpecRow label="Storage" val="2TB NVMe Gen4 SSD" />
                <SpecRow label="Power Supply" val="1000W 80+ Gold Fully Modular" />
                <SpecRow label="Cooling" val="360mm AIO Liquid Cooler" />
                <SpecRow label="Chassis" val="Singular Elite Glass Edition" />
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

const Highlight = ({ icon, label, val }) => (
  <div className="flex items-center gap-4 p-4 bg-[#F8F9FA] rounded-2xl border border-gray-100">
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#9E00FF] shadow-sm">{icon}</div>
    <div>
      <p className="text-[11px] text-gray-400 uppercase font-black tracking-widest">{label}</p>
      <p className="text-[15px] font-bold text-[#1A1A1A]">{val}</p>
    </div>
  </div>
);

const SpecRow = ({ label, val }) => (
  <tr className="hover:bg-gray-50/50 transition-colors">
    <td className="px-10 py-6 text-[15px] font-bold text-gray-400 w-1/3">{label}</td>
    <td className="px-10 py-6 text-[15px] font-bold text-[#1A1A1A]">{val}</td>
  </tr>
);

export default ProductPage;
