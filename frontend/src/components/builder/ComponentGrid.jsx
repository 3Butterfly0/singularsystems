import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import api from '../../api';
import useBuildStore from '../../store/useBuildStore';
import ComponentCard from './ComponentCard';

const ComponentGrid = ({ type, onSelect }) => {
  const { sessionSecret, currentBuild } = useBuildStore();
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchComponents();
  }, [type, sessionSecret]);

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/builder/session/${sessionSecret}/options/?type=${type}`);
      setComponents(response.data);
    } catch (error) {
      console.error(`Failed to fetch ${type} components`, error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComponents = components.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.brand?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-text-muted animate-pulse">Loading best hardware options...</p>
      </div>
    );
  }

  const selectedId = currentBuild?.selections?.[type]?.id;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder={`Search ${type}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {filteredComponents.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <p className="text-text-muted">No components found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComponents.map((component) => (
            <ComponentCard 
              key={component.id}
              component={component}
              type={type}
              onSelect={onSelect}
              isSelected={selectedId === component.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ComponentGrid;
