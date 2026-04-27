import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import useBuildStore from '../store/useBuildStore';
import api from '../api';

import StepProgress from '../components/builder/StepProgress';
import BuilderLayout from '../components/builder/BuilderLayout';
import PartList from '../components/builder/PartList';
import BuildSummary from '../components/builder/BuildSummary';

const STEPS = [
  { id: 'cpu', label: 'CPU', type: 'cpu' },
  { id: 'motherboard', label: 'Motherboard', type: 'motherboard' },
  { id: 'gpu', label: 'Graphics Card', type: 'gpu' },
  { id: 'psu', label: 'Power Supply', type: 'psu' },
  { id: 'ram', label: 'RAM', type: 'ram' },
];

const PURPOSES = [
  { id: 'gaming', label: 'Gaming', icon: '🎮', desc: 'Focus on high FPS and graphics.' },
  { id: 'work', label: 'Professional', icon: '💼', desc: 'Multithreaded power for creators.' },
  { id: 'coding', label: 'Coding / Dev', icon: '💻', desc: 'Fast compilation and multitasking.' },
  { id: 'general', label: 'General Use', icon: '🏠', desc: 'Balanced for everyday tasks.' },
];

const Builder = () => {
  const { sessionId, sessionSecret, setSession, currentBuild, setBuild, clearSession, currentStepIndex, setStepIndex } = useBuildStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showChoice, setShowChoice] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState(null);

  useEffect(() => {
    if (!sessionId || !sessionSecret) {
      startSession();
    } else {
      fetchCurrentBuild();
      setShowChoice(true);
    }
  }, []);

  const handleContinue = () => {
    setShowChoice(false);
  };

  const handleStartNew = async () => {
    setShowChoice(false);
    await handleReset();
  };

  const startSession = async () => {
    try {
      const response = await api.post('/builder/session/');
      setSession(response.data.id, response.data.session_secret);
      setBuild(response.data);
    } catch (error) {
      console.error('Failed to start session', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.reload(); 
      }
    }
  };

  const fetchCurrentBuild = async () => {
    if (!sessionId) return;
    try {
      const response = await api.get(`/builder/session/${sessionId}/`);
      setBuild(response.data);
    } catch (error) {
      console.error('Failed to fetch build', error);
      if (error.response?.status === 401 || error.response?.status === 404) {
        clearSession();
        startSession();
      }
    }
  };

  const handleReset = async () => {
    setLoading(true);
    clearSession();
    setSelectedPurpose(null);
    setStepIndex(0);
    await startSession();
    setLoading(false);
  };

  const handlePlatformSelect = async (platform) => {
    setLoading(true);
    try {
      const response = await api.patch(`/builder/session/${sessionId}/select/`, {
        platform: platform,
        purpose: selectedPurpose
      });
      setBuild(response.data);
    } catch (error) {
      console.error('Failed to select platform', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartSelect = async (part) => {
    setLoading(true);
    try {
      const response = await api.patch(`/builder/session/${sessionId}/select/`, {
        component_type: part.type,
        component_id: part.id,
        action: 'add'
      });
      
      const newBuild = response.data;
      setBuild(newBuild);

      // downstream ompatibility heck
      const currentIndex = currentStepIndex;
      for (let i = currentIndex + 1; i < STEPS.length; i++) {
        const nextType = STEPS[i].type;
      }
      
      if (currentStepIndex < STEPS.length - 1) {
        const nextType = STEPS[currentStepIndex + 1].type;
        api.get(`/builder/session/${sessionId}/options/?type=${nextType}`).catch(() => {});
      }
    } catch (error) {
      console.error('Failed to select part', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setStepIndex(currentStepIndex + 1);
    } else {
      navigate('/summary');
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStepIndex(currentStepIndex - 1);
    }
  };

  const handleStepClick = (index) => {
    setStepIndex(index);
  };

  if (showChoice && currentBuild && currentBuild.platform) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <h2 className="text-3xl font-black text-[#1A1A1A] mb-4">Welcome Back!</h2>
          <p className="text-gray-600 mb-8 font-medium">
            We found an incomplete build from your last session. Would you like to continue or start a new one?
          </p>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleContinue}
              className="w-full py-4 bg-[#9E00FF] text-white rounded-xl font-bold text-lg hover:bg-[#8A00E6] transition-all"
            >
              Continue Previous Build
            </button>
            <button 
              onClick={handleStartNew}
              className="w-full py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all"
            >
              Start New Build
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // platform selection
  if (currentBuild && !currentBuild.platform) {
    return (
      <div className="bg-[#F8F9FA] min-h-screen flex items-center justify-center p-6 py-20">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-[#1A1A1A] mb-4 tracking-tight">Setup your <span className="text-[#9E00FF]">Foundation</span></h2>
            <p className="text-gray-500 text-lg">Tell us your goals and pick your side.</p>
          </div>
          
          <div className="space-y-16">
            <div>
              <p className="text-[10px] font-black text-[#9E00FF] uppercase tracking-[0.2em] mb-6 text-center">Step 1: Your Build Intent</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PURPOSES.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedPurpose(p.id)}
                    className={`p-6 rounded-3xl border transition-all text-center group relative ${
                      selectedPurpose === p.id 
                        ? 'bg-[#9E00FF] border-[#9E00FF] shadow-xl shadow-[#9E00FF]/20 text-white' 
                        : 'bg-white border-gray-100 text-[#1A1A1A] hover:border-[#9E00FF]/30 hover:shadow-lg'
                    }`}
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{p.icon}</div>
                    <h3 className="text-xs font-black uppercase tracking-widest">{p.label}</h3>
                    {selectedPurpose === p.id && (
                      <motion.div 
                        layoutId="active-purpose"
                        className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#9E00FF] rounded-full flex items-center justify-center text-[10px] shadow-sm"
                      >
                        ✓
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className={!selectedPurpose ? 'opacity-30 grayscale pointer-events-none transition-all' : 'transition-all'}>
              <p className="text-[10px] font-black text-[#9E00FF] uppercase tracking-[0.2em] mb-6 text-center">Step 2: Choose Platform</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <PlatformButton 
                  title="Intel Core" 
                  desc="Peak gaming performance and stability." 
                  brand="intel"
                  color="bg-blue-600"
                  onClick={() => handlePlatformSelect('intel')}
                  loading={loading}
                  active={selectedPurpose}
                />
                <PlatformButton 
                  title="AMD Ryzen" 
                  desc="Value and high multicore efficiency." 
                  brand="AMD"
                  color="bg-orange-600"
                  onClick={() => handlePlatformSelect('amd')}
                  loading={loading}
                  active={selectedPurpose}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // build pc
  return (
    <BuilderLayout 
      progress={
        <StepProgress 
          steps={STEPS} 
          currentStepIndex={currentStepIndex} 
          onStepClick={handleStepClick}
        />
      }
    >
      <PartList 
        key={STEPS[currentStepIndex].id}
        type={STEPS[currentStepIndex].type}
        currentStepLabel={STEPS[currentStepIndex].label}
        onSelect={handlePartSelect}
        onNext={handleNext}
        onBack={handleBack}
        canGoNext={true}
        canGoBack={currentStepIndex > 0}
      />
      
      <BuildSummary 
        currentBuild={currentBuild}
        onNext={handleNext}
        onBack={handleBack}
        onReset={handleReset}
        isLastStep={currentStepIndex === STEPS.length - 1}
      />
    </BuilderLayout>
  );
};

const PlatformButton = ({ title, desc, brand, color, onClick, loading }) => (
  <button 
    onClick={onClick}
    disabled={loading}
    className="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-[#9E00FF]/30 transition-all text-center group relative overflow-hidden flex flex-col items-center"
  >
    <div className={`w-20 h-20 ${color} rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl`}>
      <span className="text-white font-black text-2xl uppercase tracking-tighter">{brand}</span>
    </div>
    <h3 className="text-2xl font-black text-[#1A1A1A] mb-2">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{desc}</p>
    {loading && (
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
        <Loader2 className="w-10 h-10 text-[#9E00FF] animate-spin" />
      </div>
    )}
  </button>
);

export default Builder;
