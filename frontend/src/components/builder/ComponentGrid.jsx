import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import api from '../../api';
import useBuildStore from '../../store/useBuildStore';
import ComponentCard from './ComponentCard';

const ComponentGrid = ({ type, onSelect, selectingId, prerequisiteMet = true, optimisticBuild }) => {
  const sessionId = useBuildStore((s) => s.sessionId);
  const currentBuild = useBuildStore((s) => s.currentBuild);
  const prefetchBuffer = useBuildStore((s) => s.prefetchBuffer);
  const clearPrefetchBuffer = useBuildStore((s) => s.clearPrefetchBuffer);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (!sessionId || !prerequisiteMet) return;
    
    const buffered = prefetchBuffer[type];
    if (buffered) {
      setComponents(buffered);
      setLoading(false);
      clearPrefetchBuffer(type);
    } else {
      fetchComponents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, sessionId, prerequisiteMet]);

  const fetchComponents = async (url = `/builder/session/${sessionId}/options/?type=${type}`) => {
    const isFirstPage = !url.includes('page=');
    if (isFirstPage) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await api.get(url);
      const data = response.data?.results ?? response.data;
      
      if (isFirstPage) {
        setComponents(Array.isArray(data) ? data : []);
      } else {
        setComponents(prev => [...prev, ...(Array.isArray(data) ? data : [])]);
      }

      if (response.data?.next) {
        const urlObj = new URL(response.data.next);
        setNextPage(`/builder/session/${sessionId}/options/${urlObj.search}`);
      } else {
        setNextPage(null);
      }
    } catch (error) {
      console.error(`Failed to fetch ${type} components`, error);
      setError(error.response?.data?.error || `Failed to load ${type} components.`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filteredComponents = components;

  if (!prerequisiteMet) {
    return (
      <div className="text-center py-20 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500" />
        <p className="text-yellow-500 font-bold">Select the required components in previous steps first.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-text-muted animate-pulse">Loading best hardware options...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 border border-red-500/20 bg-red-500/5 rounded-2xl flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p className="text-red-400 font-bold">{error}</p>
        <button
          onClick={() => fetchComponents()}
          className="px-6 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Backend returns flat session: currentBuild.cpu, currentBuild.gpu, etc.
  // Use optimisticBuild if provided
  const buildToUse = optimisticBuild || currentBuild;
  const typeKey = type.toLowerCase();
  const selectedId = buildToUse?.[typeKey]?.id;

  return (
    <div className="space-y-2">

      {filteredComponents.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <p className="text-text-muted">No components found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="component-grid-layout">
            {filteredComponents.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                type={type}
                onSelect={onSelect}
                isSelected={selectedId === component.id}
                selectingId={selectingId}
              />
            ))}
          </div>
          {nextPage && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchComponents(nextPage)}
                disabled={loadingMore}
                className="px-6 py-3 glass rounded-xl font-bold text-sm text-white hover:bg-white/10 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComponentGrid;
