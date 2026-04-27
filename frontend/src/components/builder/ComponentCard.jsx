import { motion } from 'framer-motion';
import { Plus, Info, Check } from 'lucide-react';

const ComponentCard = ({ component, onSelect, isSelected, type }) => {
  return (
    <motion.div 
      layout
      className={`glass rounded-2xl overflow-hidden group transition-all ${isSelected ? 'ring-2 ring-primary border-primary/50' : 'hover:border-white/20'}`}
    >
      <div className="aspect-square bg-white/5 relative overflow-hidden flex items-center justify-center p-8">
        <img 
          src={component.image || `https://placehold.co/400x400/121212/ffffff?text=${type}`} 
          alt={component.name}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
        />
        {isSelected && (
          <div className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-white line-clamp-1 flex-grow pr-2">{component.name}</h4>
          <span className="text-primary font-bold">₹{component.price?.toLocaleString()}</span>
        </div>
        
        <p className="text-xs text-text-muted mb-6 line-clamp-2">
          {component.description || `${component.brand} ${type} with high performance and reliability.`}
        </p>

        <div className="flex gap-2">
          <button 
            onClick={() => onSelect(component)}
            className={`flex-grow py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              isSelected 
              ? 'bg-white/10 text-white cursor-default' 
              : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {isSelected ? 'Selected' : <><Plus className="w-4 h-4" /> Select</>}
          </button>
          <button className="p-2 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white rounded-lg transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ComponentCard;
