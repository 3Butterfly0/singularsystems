import { memo } from 'react';
import { Check, Loader2 } from 'lucide-react';

const ComponentCard = memo(
  ({ component, onSelect, isSelected, type, selectingId }) => {
  const isSelectingThis = selectingId === component.id;
  const isSelectingOther = selectingId && !isSelectingThis;

  return (
    <button 
      onClick={() => { if (!selectingId && !isSelected) onSelect(component); }}
      disabled={!!selectingId}
      className={`relative w-full text-left bg-white rounded-xl overflow-hidden group transition-all flex items-center p-3 gap-4 ${
        isSelected 
          ? 'ring-2 ring-electric border-transparent shadow-md' 
          : 'border border-surface/20 hover:border-surface/40 hover:shadow-sm'
      } ${isSelectingOther ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {isSelectingThis && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
          <Loader2 className="w-8 h-8 text-electric animate-spin" />
        </div>
      )}
      <div className="w-16 h-16 shrink-0 bg-transparent relative overflow-hidden flex items-center justify-center p-1">
        <img 
          src={component.image || `https://placehold.co/400x400/121212/ffffff?text=${type}`} 
          alt={component.name}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
        />
        {isSelected && (
          <div className="absolute top-0 right-0 bg-electric text-white p-0.5 rounded-full shadow-sm">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>

      <div className="flex-grow min-w-0 pr-4">
        <h4 className="text-base md:text-lg font-bold text-ink line-clamp-2">{component.name}</h4>
      </div>

      <div className="shrink-0 text-right pr-2">
        <span className="text-lg font-bold text-ink">₹{component.price?.toLocaleString()}</span>
      </div>
    </button>
  );
  },
  (prev, next) =>
    prev.component.id === next.component.id &&
    prev.isSelected === next.isSelected &&
    prev.selectingId === next.selectingId
);

export default ComponentCard;
