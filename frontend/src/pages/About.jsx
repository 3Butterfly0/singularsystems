import { motion } from 'framer-motion';
import { Target, Users, Zap, Globe, Cpu, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="bg-white min-h-screen">
      <section className="bg-black py-32 px-6 text-white text-center">
        <div className="mx-auto max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-7xl font-black mb-8 leading-tight"
          >
            A team of enthusiasts <br /> building for the <span className="text-[#9E00FF]">future</span>.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto"
          >
            We are dedicated to crafting high-performance computing solutions that empower creators, gamers, and professionals to push beyond their limits.
          </motion.p>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-[1440px] grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
          <Stat val="5,000+" label="PCs Built" />
          <Stat val="99.9%" label="Customer Satisfaction" />
          <Stat val="24/7" label="Expert Support" />
          <Stat val="10+" label="Years of Excellence" />
        </div>
      </section>

      <section className="py-24 bg-[#F8F9FA] px-6">
        <div className="mx-auto max-w-[1440px] flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <img src="/hero_pc_gaming.png" alt="Our Workspace" className="rounded-3xl shadow-2xl w-full" />
          </div>
          <div className="flex-1">
            <h2 className="text-4xl font-bold text-[#1A1A1A] mb-8">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              At Singular Systems, we believe that technology should be an extension of your creative will. Our mission is to eliminate the bottlenecks between thought and action by providing hardware that is as reliable as it is powerful.
            </p>
            <div className="space-y-6">
              <ValueItem icon={<Award className="w-6 h-6" />} title="Quality Uncompromised" desc="We use only premium components from industry-leading partners." />
              <ValueItem icon={<Users className="w-6 h-6" />} title="Community First" desc="We build for the community, with the community's feedback in mind." />
              <ValueItem icon={<Target className="w-6 h-6" />} title="Precision Engineering" desc="Every build undergoes a 48-hour rigorous stress-testing phase." />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <Globe className="w-16 h-16 text-[#9E00FF] mx-auto mb-8" />
          <h2 className="text-4xl font-bold text-[#1A1A1A] mb-6">Global Reach, Personal Touch</h2>
          <p className="text-lg text-gray-500 mb-12 leading-relaxed">
            While our systems are shipped worldwide, our heart remains in our assembly facility where every PC is treated with the care of a custom masterpiece. We don't just ship boxes; we ship potential.
          </p>
          <button className="bg-black text-white px-10 py-4 rounded-md font-bold hover:bg-gray-800 transition-all">
            Contact Our Team
          </button>
        </div>
      </section>
    </div>
  );
};

const Stat = ({ val, label }) => (
  <div className="space-y-2">
    <p className="text-5xl font-black text-[#9E00FF]">{val}</p>
    <p className="text-gray-500 font-bold uppercase tracking-wider text-sm">{label}</p>
  </div>
);

const ValueItem = ({ icon, title, desc }) => (
  <div className="flex gap-4">
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#9E00FF] shadow-sm shrink-0">{icon}</div>
    <div>
      <h4 className="text-xl font-bold text-[#1A1A1A] mb-1">{title}</h4>
      <p className="text-gray-500">{desc}</p>
    </div>
  </div>
);

export default About;
