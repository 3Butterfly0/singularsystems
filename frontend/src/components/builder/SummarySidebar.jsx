import { AlertTriangle, ChevronRight } from 'lucide-react';

const SummarySidebar = ({ currentBuild, STEPS, currentStep, onNext }) => {
  return (
    <div className="w-full md:w-80 shrink-0">
      <div className="glass rounded-2xl p-6 sticky top-28">
        <h3 className="text-lg font-bold mb-6 border-b border-white/5 pb-4">Build Summary</h3>
        
        <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {STEPS.slice(1).map((step) => {
            const selected = currentBuild?.selections?.[step.id];
            return (
              <div key={step.id} className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">{step.label}</p>
                  <p className="text-sm text-white line-clamp-1">{selected ? selected.name : 'Not selected'}</p>
                </div>
                {selected && <p className="text-sm font-medium text-primary">₹{selected.price?.toLocaleString()}</p>}
              </div>
            );
          })}
        </div>

        <div className="space-y-2 border-t border-white/5 pt-6">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Estimated Wattage</span>
            <span className={`font-medium ${currentBuild?.total_wattage > currentBuild?.psu_wattage ? 'text-red-500' : 'text-white'}`}>
              {currentBuild?.total_wattage || 0}W 
              {currentBuild?.psu_wattage ? ` / ${currentBuild.psu_wattage}W` : ''}
            </span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2">
            <span>Total</span>
            <span className="text-primary">₹{currentBuild?.total_price?.toLocaleString() || 0}</span>
          </div>
        </div>

        {currentBuild?.compatibility_notes?.length > 0 && (
          <div className="mt-6 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-orange-500 uppercase">Compatibility Notes</p>
              {currentBuild.compatibility_notes.map((note, i) => (
                <p key={i} className="text-[10px] text-orange-200">{note}</p>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={onNext}
          disabled={!currentBuild?.selections?.[STEPS[currentStep].id] && currentStep !== 0}
          className="w-full mt-8 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(123,44,191,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === STEPS.length - 1 ? 'Review Build' : 'Next Step'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SummarySidebar;
