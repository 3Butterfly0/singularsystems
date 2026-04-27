import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Filter, ArrowLeft, ArrowRight } from "lucide-react";
import api from "../../api";
import useBuildStore from "../../store/useBuildStore";
import ComponentTable from "./ComponentTable";

const PartList = ({
  type,
  onSelect,
  currentStepLabel,
  onNext,
  onBack,
  canGoNext,
  canGoBack,
}) => {
  const { sessionId, currentBuild } = useBuildStore();
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recommended");

  useEffect(() => {
    fetchComponents();
  }, [type, sessionId]);

  const fetchComponents = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const response = await api.get(
        `/builder/session/${sessionId}/options/?type=${type}`,
      );
      setComponents(response.data);
    } catch (error) {
      console.error(`Failed to fetch ${type} components`, error);
    } finally {
      setLoading(false);
    }
  };

  const sortedComponents = useMemo(() => {
    let sorted = [...components];
    if (sortBy === "price_asc") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === "recommended") {
      sorted.sort((a, b) => {
        if (a.is_recommended && !b.is_recommended) return -1;
        if (!a.is_recommended && b.is_recommended) return 1;
        return a.price - b.price;
      });
    }
    return sorted;
  }, [components, sortBy]);

  const selectedId = useMemo(() => {
    if (!currentBuild) return null;
    if (currentBuild[type]?.id) return currentBuild[type].id;
    if (type === "cpu")
      return currentBuild.intel_cpu?.id || currentBuild.amd_cpu?.id;
    if (type === "motherboard")
      return (
        currentBuild.intel_motherboard?.id || currentBuild.amd_motherboard?.id
      );
    return null;
  }, [currentBuild, type]);

  return (
    <div className="flex-grow h-full flex flex-col p-6 md:p-10 bg-white">
      <div className="flex-none flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] font-black text-[#9E00FF] uppercase tracking-[0.2em] mb-2">
            Step Selection
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tight">
            Choose your{" "}
            <span className="text-[#9E00FF]">{currentStepLabel}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
          <div className="p-2 text-gray-400">
            <Filter className="w-4 h-4" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-[13px] font-bold text-[#1A1A1A] pr-8 focus:outline-none cursor-pointer"
          >
            <option value="recommended">Recommended</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* parts table */}
      <div className="flex-grow min-h-0 border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50/50">
            <Loader2 className="w-12 h-12 text-[#9E00FF] animate-spin mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
              Optimizing compatible options...
            </p>
          </div>
        ) : (
          <ComponentTable
            components={sortedComponents}
            selectedId={selectedId}
            onSelect={onSelect}
            type={type}
          />
        )}
      </div>

      <div className="flex-none mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className={`flex items-center gap-2 px-6 py-4 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all ${
            canGoBack
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous Step
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-3 px-8 py-4 bg-[#1A1A1A] text-white rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-[#2A2A2A] transition-all shadow-lg active:scale-95 group"
        >
          Next Step
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default PartList;
