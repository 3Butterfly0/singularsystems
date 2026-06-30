import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Check, ArrowRight, Loader2, Cpu, HardDrive, Monitor, Zap } from 'lucide-react';
import api from '../../api';
import useBuildStore from '../../store/useBuildStore';

const LoadBuildCard = ({ buildData }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { sessionId, setSession, setBuild, setStepIndex } = useBuildStore();
  const navigate = useNavigate();

  // selection order --> platform, cpu_id, motherboard_id, gpu_id, ram_id, psu_id, storage_id?, cooler_id?, case_id
  const parts = [
    { key: 'cpu_id',        label: 'CPU',         icon: <Cpu className="w-3 h-3"/> },
    { key: 'motherboard_id',label: 'Motherboard',  icon: <Cpu className="w-3 h-3"/> },
    { key: 'gpu_id',        label: 'GPU',          icon: <Monitor className="w-3 h-3"/> },
    { key: 'ram_id',        label: 'RAM',          icon: <Zap className="w-3 h-3"/> },
    { key: 'psu_id',        label: 'PSU',          icon: <Zap className="w-3 h-3"/> },
    { key: 'storage_id',    label: 'Storage',      icon: <HardDrive className="w-3 h-3"/> },
    { key: 'cooler_id',     label: 'Cooler',       icon: <Zap className="w-3 h-3"/> },
    { key: 'case_id',       label: 'Case',         icon: <Zap className="w-3 h-3"/> },
  ].filter(p => buildData[p.key] && buildData[p.key] !== 'null');

  const handleLoad = async () => {
    setLoading(true);
    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const { data } = await api.post('/builder/session/');
        setSession(data.id, data.session_secret);
        setBuild(data);
        activeSessionId = data.id;
      }
      const response = await api.post(`/builder/session/${activeSessionId}/load/`, buildData);
      setBuild(response.data);
      setSuccess(true);

      setTimeout(() => {
        setStepIndex(0);
        navigate('/builder');
      }, 900);
    } catch (error) {
      console.error('Failed to load build', error);
      alert('Failed to load build. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/10 border border-[#9E00FF]/30 rounded-2xl p-5 my-4 overflow-hidden relative group"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-[#9E00FF]/20 rounded-lg">
          <Zap className="w-4 h-4 text-[#9E00FF]" />
        </div>
        <h4 className="text-white font-black text-xs uppercase tracking-widest">Recommended Configuration</h4>
      </div>

      <div className="space-y-2.5 mb-6">
        {buildData.platform && (
          <BuildItem icon={<Cpu className="w-3 h-3"/>} label="Platform" value={buildData.platform.toUpperCase()} />
        )}
        {parts.map(p => (
          <BuildItem key={p.key} icon={p.icon} label={p.label} value="✓ Included" />
        ))}
      </div>

      <button
        onClick={handleLoad}
        disabled={loading || success}
        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
          success
            ? 'bg-green-500 text-white'
            : 'bg-[#9E00FF] text-white hover:bg-[#8A00E6] shadow-lg shadow-[#9E00FF]/20'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : success ? (
          <>
            <Check className="w-4 h-4" />
            Build Applied — Redirecting...
          </>
        ) : (
          <>
            Load this Build
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#9E00FF]/10 rounded-full blur-2xl group-hover:bg-[#9E00FF]/20 transition-all" />
    </motion.div>
  );
};

const BuildItem = ({ icon, label, value }) => (
  <div className="flex items-center justify-between text-[11px]">
    <div className="flex items-center gap-2 text-gray-400">
      {icon}
      <span className="font-bold uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-green-400 font-medium">{value}</span>
  </div>
);

export default LoadBuildCard;
