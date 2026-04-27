import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, Activity, ShieldCheck, ArrowRight, Tag, ThumbsUp, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import heroImg from '../assets/images/heroImg.png';
import pc1 from '../assets/images/pc1.png';
import pc2 from '../assets/images/pc2.png';
import pc3 from '../assets/images/pc3.png';
import pc4 from '../assets/images/pc4.png';
import gradient from '../assets/images/gradient.png';

const Prebuilts = () => {
  const navigate = useNavigate();

  const [gamingPCs, setGamingPCs] = React.useState([]);
  const [workstationPC, setWorkstationPC] = React.useState(null);

  React.useEffect(() => {
    const fetchPrebuilts = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/builder/prebuilt/');
        const data = await response.json();
        
        const gaming = data.filter(pc => pc.category === 'gaming');
        const editing = data.filter(pc => pc.category === 'editing' || pc.category === 'design');
        
        if (gaming.length > 0) {
          setGamingPCs(gaming.map((pc, index) => ({
            id: pc.id,
            name: pc.name,
            price: pc.total_price?.toLocaleString('en-IN') || pc.price?.toLocaleString('en-IN'),
            image: pc.image ? `http://localhost:8000${pc.image}` : (index === 0 ? pc2 : (index === 1 ? pc1 : pc3)),
            specs: { 
              cpu: pc.intel_cpu_name || pc.amd_cpu_name || "Custom CPU", 
              gpu: pc.gpu_name || "Custom GPU", 
              ram: pc.ram_name || "Custom RAM" 
            }
          })));
        } else {
          setGamingPCs([
            {
              name: "FORGE",
              price: "84,999",
              image: pc2,
              specs: { cpu: "i5 13400F", gpu: "RTX 4060", ram: "16GB DDR5" }
            },
            {
              name: "VETERAN",
              price: "1,49,999",
              image: pc1,
              specs: { cpu: "i7 13700K", gpu: "RTX 4070 Ti", ram: "32GB DDR5" },
              featured: true
            },
            {
              name: "ELITE",
              price: "2,89,999",
              image: pc3,
              specs: { cpu: "i9 13900K", gpu: "RTX 4090", ram: "64GB DDR5" }
            }
          ]);
        }

        if (editing.length > 0) {
          const ws = editing[0];
          setWorkstationPC({
            name: ws.name,
            image: ws.image ? `http://localhost:8000${ws.image}` : pc4,
            cpu: ws.intel_cpu_name || ws.amd_cpu_name || "i9 13900KS",
            gpu: ws.gpu_name || "RTX 4090",
            ram: ws.ram_name || "128GB DDR5"
          });
        }
      } catch (error) {
        console.error("Failed to fetch prebuilts:", error);
        // fallback
        setGamingPCs([
          {
            name: "FORGE",
            price: "84,999",
            image: pc2,
            specs: { cpu: "i5 13400F", gpu: "RTX 4060", ram: "16GB DDR5" }
          },
          {
            name: "VETERAN",
            price: "1,49,999",
            image: pc1,
            specs: { cpu: "i7 13700K", gpu: "RTX 4070 Ti", ram: "32GB DDR5" },
            featured: true
          },
          {
            name: "ELITE",
            price: "2,89,999",
            image: pc3,
            specs: { cpu: "i9 13900K", gpu: "RTX 4090", ram: "64GB DDR5" }
          }
        ]);
      }
    };
    fetchPrebuilts();
  }, []);

  return (
    <div className="w-full bg-white font-['Inter']">
      <section className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
        <img 
          src={heroImg} 
          alt="Pre-Built Collection" 
          className="w-full h-full object-cover"
        />
      </section>

      <section className="py-24 px-6 max-w-[1440px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-[#1A1A1A] mb-4">CLUTCH Series</h2>
          <p className="text-xl text-gray-500 font-medium">For the gamer in YOU</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {gamingPCs.map((pc, index) => (
            <motion.div 
              key={pc.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-[32px] p-8 border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col items-center text-center relative hover:shadow-[0_30px_60px_rgba(158,0,255,0.1)] transition-all group`}
            >
              <div className="w-full aspect-square mb-8 flex items-center justify-center">
                <img 
                  src={pc.image} 
                  alt={pc.name} 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <h3 className="text-3xl font-black text-[#1A1A1A] mb-2">{pc.name}</h3>
              <p className="text-2xl font-black text-[#9E00FF] mb-8">₹{pc.price}</p>
              
              <div className="w-full space-y-4 mb-10 text-left px-4">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="w-1 h-1 bg-[#9E00FF] rounded-full" />
                  <span>{pc.specs.cpu}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="w-1 h-1 bg-[#9E00FF] rounded-full" />
                  <span>{pc.specs.gpu}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="w-1 h-1 bg-[#9E00FF] rounded-full" />
                  <span>{pc.specs.ram}</span>
                </div>
              </div>

              <button className="w-full py-4 bg-[#9E00FF] text-white rounded-xl font-bold text-lg hover:bg-[#8000FF] transition-colors active:scale-95">
                BUY
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative w-full py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={gradient} alt="" className="w-full h-full object-cover opacity-90" />
        </div>
        
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 flex flex-col items-center text-center text-white">
          <h2 className="text-6xl md:text-8xl font-black mb-4">{workstationPC?.name || "RENDERO"}</h2>
          <p className="text-2xl font-medium opacity-90 mb-12">For the Artist in YOU</p>
          
          <div className="w-full max-w-4xl mb-16">
            <motion.img 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              src={workstationPC?.image || pc4} 
              alt="Rendero Workstation" 
              className="w-full h-auto object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.5)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl mb-16">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <p className="text-sm font-bold opacity-70 uppercase tracking-widest mb-1">Processor</p>
              <p className="text-2xl font-black">{workstationPC?.cpu || "i9 13900KS"}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <p className="text-sm font-bold opacity-70 uppercase tracking-widest mb-1">Memory</p>
              <p className="text-2xl font-black">{workstationPC?.ram || "128GB DDR5"}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <p className="text-sm font-bold opacity-70 uppercase tracking-widest mb-1">Graphics</p>
              <p className="text-2xl font-black">{workstationPC?.gpu || "RTX 4090"}</p>
            </div>
          </div>

          <button className="px-16 py-5 bg-white text-[#9E00FF] rounded-md font-black text-xl hover:bg-gray-100 transition-all shadow-2xl active:scale-95">
            SHOP
          </button>
        </div>
      </section>

      <section className="py-24 px-6 max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-black text-[#9E00FF] mb-10 uppercase">WHY GET A PRE-BUILD?</h2>
            
            <div className="space-y-12">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-14 h-14 bg-[#9E00FF]/10 rounded-2xl flex items-center justify-center text-[#9E00FF]">
                  <Tag className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-[#1A1A1A] mb-2">Price</h4>
                  <p className="text-gray-500 text-lg leading-relaxed">
                    Save on building fees and the cost of purchasing parts separately.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-14 h-14 bg-[#9E00FF]/10 rounded-2xl flex items-center justify-center text-[#9E00FF]">
                  <ThumbsUp className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-[#1A1A1A] mb-2">Quality</h4>
                  <p className="text-gray-500 text-lg leading-relaxed">
                    Get the same high-quality components you would when purchasing a Custom PC
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-14 h-14 bg-[#9E00FF]/10 rounded-2xl flex items-center justify-center text-[#9E00FF]">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-[#1A1A1A] mb-2">Convenience</h4>
                  <p className="text-gray-500 text-lg leading-relaxed">
                    Pre-Assembled powerful PCs, ready to play without the hassle of building
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="absolute -inset-4 border-2 border-[#9E00FF] rounded-[40px] opacity-20" />
            <div className="bg-gray-50 rounded-[32px] overflow-hidden p-4">
              <img 
                src={pc1} 
                alt="Why choose pre-built" 
                className="w-full h-auto rounded-2xl drop-shadow-2xl" 
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Prebuilts;
