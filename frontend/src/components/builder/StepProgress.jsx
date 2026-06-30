import React from 'react';

const StepProgress = ({ steps, currentStepIndex, onStepClick, currentBuild }) => {
  const isClickable = (step, index) => {
    if (index === 0) return true;
    if (!step.type) return index <= currentStepIndex;
    return !!currentBuild?.[step.type] || index === currentStepIndex;
  };

  return (
    <div className="w-full bg-background border-b border-white/10 py-4 px-6 overflow-x-auto no-scrollbar">
      <div className="max-w-[1440px] mx-auto flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase tracking-wider">
        {steps.map((step, index) => {
          const isCurrent = index === currentStepIndex;
          const clickable = isClickable(step, index);
          
          return (
            <React.Fragment key={step.id}>
              <button 
                onClick={() => clickable && onStepClick && onStepClick(index)}
                disabled={!clickable}
                className={`transition-colors ${
                  isCurrent 
                    ? 'text-primary' 
                    : clickable 
                      ? 'text-white hover:text-primary' 
                      : 'text-text-muted cursor-not-allowed'
                }`}
              >
                {step.label}
              </button>
              {index < steps.length - 1 && (
                <span className="text-text-muted/50 select-none">&gt;</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;
