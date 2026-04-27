import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import useBuildStore from '../store/useBuildStore';

import heroImg from '../assets/images/heroImg.png';
import pc1 from '../assets/images/pc1.png';
import pc2 from '../assets/images/pc2.png';
import pc3 from '../assets/images/pc3.png';
import pc4 from '../assets/images/pc4.png';
import gradient from '../assets/images/gradient.png';

const Home = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const { clearSession } = useBuildStore();

  const brands = [
    { name: "intel", path: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Intel-logo.svg" },
    { name: "AMD", path: "https://upload.wikimedia.org/wikipedia/commons/7/7c/AMD_Logo.svg" },
    { name: "NVIDIA", path: "https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg" },
    { name: "Cooler Master", path: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Cooler_Master_logo.svg" },
    { name: "NZXT", path: "https://upload.wikimedia.org/wikipedia/commons/1/1b/NZXT_Logo.svg" },
    { name: "Corsair", path: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Corsair_Logo.svg" }
  ];

  const prebuiltImages = [pc1, pc2, pc3];
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % prebuiltImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + prebuiltImages.length) % prebuiltImages.length);

  return (
    <div className="flex flex-col w-full bg-white overflow-hidden">
      
      {/* hero section */}
      <section className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ y: y1 }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={heroImg} 
            alt="Hero Background" 
            className="w-full h-full object-cover brightness-[0.4]"
          />
        </motion.div>
        
        <div className="relative z-10 text-center px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl lg:text-[72px] font-black text-white leading-tight tracking-tight max-w-5xl mx-auto"
          >
            Your Vision, Our Craftsmanship.<br />
            <span className="text-[#9E00FF]">Singular Excellence.</span>
          </motion.h1>
        </div>
      </section>

      {/* custom build section */}
      <section className="relative w-full bg-[#9E00FF] py-20 lg:py-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
           <img src={gradient} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="mx-auto max-w-[1440px] px-6 lg:h-[680px] flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-white z-10"
          >
            <h2 className="text-3xl lg:text-[48px] font-black leading-tight mb-8">
              Distinctly Yours, <br />
              <span className="opacity-80">Distinctly Powerful.</span>
            </h2>
            <p className="text-lg lg:text-xl text-white/90 font-medium mb-10 max-w-lg leading-relaxed">
              Build your PC on your own using our <span className="underline font-bold">Custom PC Configurator</span> today!
            </p>
            <p className="text-md lg:text-lg text-white/80 mb-12 max-w-md">
              Choose parts as per your wish and make your Own Distinct Beast!
            </p>
            <button 
              onClick={() => {
                clearSession();
                navigate('/builder');
              }}
              className="px-12 py-5 bg-white text-[#9E00FF] rounded-md font-black text-xl hover:bg-gray-100 transition-all shadow-xl active:scale-95"
            >
              BUILD
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="flex-1 relative flex justify-center"
          >
            <img 
              src={pc4} 
              alt="White Gaming PC" 
              className="w-full max-w-[530px] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
            />
          </motion.div>
        </div>

        {/* brand slider */}
        <div className="w-full bg-[#9E00FF] py-14 overflow-hidden relative z-20">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-20 whitespace-nowrap"
          >
            {[...brands, ...brands, ...brands].map((brand, i) => (
              <img 
                key={i} 
                src={brand.path} 
                alt={brand.name} 
                className="h-8 md:h-10 object-contain opacity-70 grayscale brightness-200" 
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* pre-built section */}
      <section className="py-24 bg-[#F5F5F5] px-6 overflow-hidden">
        <div className="mx-auto max-w-[1440px] flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 w-full max-w-[600px] relative group">
            <motion.div 
              className="bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <img src={gradient} alt="" className="w-full h-full object-cover" />
              </div>
              
              <motion.img 
                key={currentSlide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                src={prebuiltImages[currentSlide]} 
                alt="Pre-built PC" 
                className="w-full h-[400px] object-contain relative z-10"
              />

              <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur rounded-full shadow-lg hover:bg-white transition-all z-20"
              >
                <ChevronLeft className="w-6 h-6 text-[#9E00FF]" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur rounded-full shadow-lg hover:bg-white transition-all z-20"
              >
                <ChevronRight className="w-6 h-6 text-[#9E00FF]" />
              </button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1"
          >
            <h3 className="text-2xl text-gray-800 font-medium mb-4">Building from scratch seems Overwhelming?</h3>
            <h2 className="text-3xl lg:text-[48px] font-black text-[#1A1A1A] leading-tight mb-10">
              CHOOSE FROM OUR <br />
              RANGE OF <span className="text-[#9E00FF]">PRE-BUILT PCs</span>
            </h2>
            <button 
              onClick={() => navigate('/prebuilts')}
              className="px-16 py-5 border-2 border-[#9E00FF] text-[#1A1A1A] rounded-md font-black text-xl hover:bg-[#9E00FF] hover:text-white transition-all active:scale-95"
            >
              SHOP
            </button>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white px-6">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <FeatureItem title="Premium Parts" desc="We use only top-tier components from industry-leading brands." />
            <FeatureItem title="Stress Tested" desc="Each build undergoes 24h rigorous testing before shipment." />
            <FeatureItem title="Lifetime Warranty" desc="Enjoy peace of mind with our comprehensive lifetime support." />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureItem = ({ title, desc }) => (
  <div className="flex flex-col items-center">
    <div className="w-2 h-12 bg-[#9E00FF] rounded-full mb-6" />
    <h4 className="text-xl font-bold text-[#1A1A1A] mb-3">{title}</h4>
    <p className="text-gray-500 max-w-xs mx-auto">{desc}</p>
  </div>
);

export default Home;
