import React from 'react';
import { ChevronRight } from 'lucide-react';

const StepProgress = ({ steps, currentStepIndex, onStepClick }) => {
  return (
    <div className="w-full bg-white border-b border-gray-100 py-4 px-6 overflow-x-auto no-scrollbar">
      <div className="max-w-[1440px] mx-auto flex items-center justify-center gap-4 whitespace-nowrap">
        {steps.map((step, index) => {
          const isCurrent = index === currentStepIndex;
          const isPast = index < currentStepIndex;
          
          return (
            <React.Fragment key={step.id}>
              <button 
                onClick={() => onStepClick && onStepClick(index)}
                disabled={isCurrent}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all group ${
                  isCurrent 
                    ? 'bg-[#9E00FF]/5 text-[#9E00FF] font-black ring-1 ring-[#9E00FF]/10' 
                    : isPast 
                      ? 'text-gray-500 font-bold hover:bg-gray-50' 
                      : 'text-gray-300 font-medium cursor-not-allowed'
                }`}
              >
                <span className="uppercase text-[10px] tracking-[0.2em]">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${isPast ? 'text-[#9E00FF]/20' : 'text-gray-100'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;
