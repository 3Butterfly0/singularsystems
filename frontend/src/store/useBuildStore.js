import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useBuildStore = create(
  persist(
    (set) => ({
      sessionId: null,
      sessionSecret: null,
      currentBuild: null,
      compatibility: {
        status: 'valid',
        warnings: [],
      },
      totalPrice: 0,
      totalWattage: 0,
      currentStepIndex: 0,

      setStepIndex: (index) => set({ currentStepIndex: index }),

      setSession: (id, secret) => {
        set({ sessionId: id, sessionSecret: secret });
      },

      setBuild: (build) => {
        set({ 
          currentBuild: build,
          totalPrice: build?.total_price || 0,
          totalWattage: build?.estimated_watts || 0,
          compatibility: {
            status: build?.is_compatible ? 'valid' : 'warning',
            warnings: build?.compatibility_notes || [],
          }
        });
      },

      clearSession: () => {
        set({ 
          sessionId: null, 
          sessionSecret: null, 
          currentBuild: null, 
          totalPrice: 0, 
          totalWattage: 0,
          currentStepIndex: 0,
          compatibility: { status: 'valid', warnings: [] }
        });
      }
    }),
    {
      name: 'ss-build-storage',
    }
  )
);

export default useBuildStore;
