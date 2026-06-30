import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { PageShell, PageHeader } from '@/components/PageShell';
import api from '@/api';
import useBuildStore from '@/store/useBuildStore';
import useCartStore from '@/store/useCartStore';

const COMPONENT_KEYS = [
  { key: 'cpu',         label: 'Processor' },
  { key: 'gpu',         label: 'Graphics' },
  { key: 'motherboard', label: 'Motherboard' },
  { key: 'ram',         label: 'Memory' },
  { key: 'primary_storage', label: 'Primary Storage' },
  { key: 'secondary_storage', label: 'Secondary Storage' },
  { key: 'cooler',      label: 'Cooling' },
  { key: 'psu',         label: 'Power' },
  { key: 'case',        label: 'Chassis' },
];

const PURPOSES = [
  { value: 'gaming',        label: 'Gaming' },
  { value: 'workstation',   label: 'Workstation' },
  { value: 'video_editing', label: 'Video Editing' },
];

const COLOR_STYLES = {
  green:  { border: 'border-emerald-500/40', bg: 'bg-emerald-500/5',  dot: 'bg-emerald-400', text: 'text-emerald-400' },
  yellow: { border: 'border-amber-400/40',   bg: 'bg-amber-400/5',    dot: 'bg-amber-400',   text: 'text-amber-400'   },
  red:    { border: 'border-red-500/40',      bg: 'bg-red-500/5',      dot: 'bg-red-400',     text: 'text-red-400'     },
};

// --- Build Assessor Card ---
function BuildAssessorCard({ assessment, loading }) {
  if (loading) {
    return (
      <div className="px-6 lg:px-8 py-6 border-b border-surface/60">
        <div className="label text-ink/50 mb-3">AI Build Assessment</div>
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-surface/60 rounded w-3/4" />
          <div className="h-3 bg-surface/60 rounded w-full" />
          <div className="h-3 bg-surface/60 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!assessment || !assessment.headline) return null;

  const styles = COLOR_STYLES[assessment.overall_color] || COLOR_STYLES.green;

  return (
    <div className="px-6 lg:px-8 py-6 border-b border-surface/60">
      <div className="label text-ink/50 mb-3">AI Build Assessment</div>
      <div className={`border ${styles.border} ${styles.bg} p-4 rounded`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`size-2 rounded-full ${styles.dot}`} />
          <span className={`label ${styles.text}`}>{assessment.headline}</span>
        </div>
        {assessment.analysis && (
          <p className="text-xs text-ink/60 leading-relaxed mb-2">{assessment.analysis}</p>
        )}
        {assessment.actionable_advice && (
          <p className={`text-xs ${styles.text} leading-relaxed`}>{assessment.actionable_advice}</p>
        )}
      </div>
    </div>
  );
}

// --- Purpose Selector ---
function PurposeSelector({ sessionId, currentPurpose, onPurposeChange, sessionSecret }) {
  const [selected, setSelected] = useState(currentPurpose || 'gaming');
  const [saving, setSaving] = useState(false);

  const handleSelect = async (value) => {
    if (value === selected || saving) return;
    setSelected(value);
    setSaving(true);
    try {
      const headers = sessionSecret ? { 'X-BUILD-SESSION-SECRET': sessionSecret } : {};
      await api.patch(`/builder/session/${sessionId}/purpose/`, { purpose: value }, { headers });
      onPurposeChange(value);
    } catch (err) {
      console.error('Failed to update purpose', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 lg:px-8 py-6 border-b border-surface/60">
      <div className="label text-ink/50 mb-3">Build Purpose</div>
      <div className="flex gap-2 flex-wrap">
        {PURPOSES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            disabled={saving}
            className={`px-3 py-1.5 text-xs label transition-colors border ${
              selected === value
                ? 'bg-electric text-primary-foreground border-electric'
                : 'border-surface text-ink/60 hover:border-ink/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SummaryPage() {
  const navigate = useNavigate();
  const sessionId = useBuildStore((s) => s.sessionId);
  const currentBuild = useBuildStore((s) => s.currentBuild);
  const addItem = useCartStore((s) => s.addItem);
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // AI Assessor state
  const [assessment, setAssessment] = useState(null);
  const [assessLoading, setAssessLoading] = useState(false);
  const [purpose, setPurpose] = useState(currentBuild?.purpose || 'gaming');
  const debounceRef = useRef(null);

  const sessionSecret = typeof window !== 'undefined'
    ? localStorage.getItem('session_secret')
    : null;

  const triggerAssessment = useCallback(async () => {
    if (!sessionId) return;
    setAssessLoading(true);
    try {
      const headers = sessionSecret ? { 'X-BUILD-SESSION-SECRET': sessionSecret } : {};
      const res = await api.post(`/builder/session/${sessionId}/analyze/`, {}, { headers });
      setAssessment(res.data);
    } catch (err) {
      console.error('Assessment failed silently', err);
      setAssessment(null);
    } finally {
      setAssessLoading(false);
    }
  }, [sessionId, sessionSecret]);

  // Track component IDs to trigger a debounced re-evaluation on build changes
  const componentIdsStr = JSON.stringify([
    currentBuild?.cpu?.id,
    currentBuild?.gpu?.id,
    currentBuild?.motherboard?.id,
    currentBuild?.ram?.id,
    currentBuild?.ram_qty,
    currentBuild?.cooler?.id,
    currentBuild?.primary_storage?.id,
    currentBuild?.secondary_storage?.id,
    currentBuild?.psu?.id,
    currentBuild?.case?.id,
  ]);

  // Trigger assessment on mount and re-trigger when purpose or components change (debounced 1s)
  useEffect(() => {
    if (!sessionId) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(triggerAssessment, 1000);
    return () => clearTimeout(debounceRef.current);
  }, [sessionId, purpose, componentIdsStr, triggerAssessment]);

  // No active build
  if (!sessionId || !currentBuild) {
    return (
      <PageShell>
        <div className="px-6 lg:px-10 py-20 text-center">
          <p className="label text-ink/50 mb-6">No active build session found.</p>
          <Link to="/builder" className="bg-electric text-primary-foreground px-6 py-4 label hover:bg-ink transition-colors">
            Start Building →
          </Link>
        </div>
      </PageShell>
    );
  }

  const lineItems = COMPONENT_KEYS
    .map(({ key, label }) => {
      const comp = currentBuild[key];
      if (!comp) return null;
      const qty = key === 'ram' ? (currentBuild.ram_qty || 1) : 1;
      return {
        key,
        label,
        name: qty > 1 ? `${comp.name} (x${qty})` : comp.name,
        spec: comp.description || '',
        price: comp.price * qty
      };
    })
    .filter(Boolean);

  const subtotal = lineItems.reduce((s, i) => s + (i.price || 0), 0);
  const assembly = 350;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + assembly + tax;

  const handleCommission = async () => {
    setOrdering(true);
    setOrderError(null);
    try {
      await addItem({ type: 'custom_build', id: sessionId });
      navigate('/cart');
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setOrderError('Failed to add build to cart. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Build Manifest · Final Review"
        title={
          <>
            Architecture<br />
            <span className="text-surface">Validated.</span>
          </>
        }
        description="All subsystems pass thermal and electrical compatibility. Burn-in testing will run for 48 hours prior to ship."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-surface/60">
        <section className="lg:col-span-8 bg-background">
          {/* Components manifest */}
          <div className="px-6 lg:px-10 py-10 border-b border-surface/60">
            <div className="flex items-center gap-3 mb-8">
              <div className="size-2 bg-electric" />
              <h2 className="label">Components Manifest</h2>
            </div>
            <div className="border-t border-surface/60">
              {lineItems.map((item) => {
                const isFlagged = assessment?.flagged_components?.some(
                  (f) => String(f).toLowerCase() === item.key.toLowerCase()
                );
                return (
                  <div
                    key={item.label}
                    className={`grid grid-cols-12 gap-4 py-5 border-b border-surface/60 items-center transition-all ${
                      isFlagged ? 'bg-red-500/5 px-4 -mx-4 border-l-2 border-l-red-500' : ''
                    }`}
                  >
                    <div className="col-span-3 label text-ink/50">{item.label}</div>
                    <div className="col-span-6">
                      <div className="font-bold uppercase tracking-tight text-sm flex items-center gap-2">
                        {item.name}
                        {isFlagged && (
                          <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                            Flagged
                          </span>
                        )}
                      </div>
                      {item.spec && <div className="label text-ink/50 mt-1 line-clamp-1">{item.spec}</div>}
                    </div>
                    <div className="col-span-3 text-right font-bold tabular-nums">
                      &#8377;{item.price?.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compatibility notes */}
          {currentBuild.compatibility_notes?.length > 0 && (
            <div className="px-6 lg:px-10 py-6 border-b border-surface/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-2 bg-orange-400" />
                <h2 className="label text-orange-400">Compatibility Warnings</h2>
              </div>
              <ul className="space-y-2">
                {currentBuild.compatibility_notes.map((note, i) => (
                  <li key={i} className="label text-orange-300">· {note}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="lg:col-span-4 bg-background">
          {/* Purpose selector */}
          <PurposeSelector
            sessionId={sessionId}
            currentPurpose={purpose}
            onPurposeChange={setPurpose}
            sessionSecret={sessionSecret}
          />

          {/* AI Build Assessor */}
          <BuildAssessorCard assessment={assessment} loading={assessLoading} />

          {/* Power Summary */}
          {currentBuild?.estimated_watts > 0 && (
            <div className="px-6 lg:px-8 py-6 border-b border-surface/60">
              <div className="label text-ink/50 mb-4">Power Specifications</div>
              <div className="flex justify-between text-sm">
                <span className="text-ink/60">Estimated System Draw</span>
                <span className={`tabular-nums font-medium ${currentBuild?.estimated_watts > (currentBuild?.psu?.wattage || 0) ? 'text-orange-400' : 'text-ink'}`}>
                  {currentBuild?.estimated_watts}W
                  {currentBuild?.psu?.wattage ? ` / ${currentBuild.psu.wattage}W (PSU)` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Order summary */}
          <div className="px-6 lg:px-8 py-10 border-b border-surface/60">
            <div className="label text-ink/50 mb-4">Order Summary</div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/60">Components</span>
                <span className="tabular-nums font-medium">&#8377;{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Cleanroom Assembly</span>
                <span className="tabular-nums font-medium">&#8377;{assembly}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Tax (8%)</span>
                <span className="tabular-nums font-medium">&#8377;{tax}</span>
              </div>
            </div>
            <div className="border-t border-surface/60 mt-6 pt-6 flex justify-between items-end">
              <div className="label text-ink/50">Total</div>
              <div className="text-4xl font-extrabold tabular-nums tracking-tighter">
                &#8377;{total.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="px-6 lg:px-8 py-6 space-y-3">
            {orderError && (
              <p className="label text-red-400 text-center">{orderError}</p>
            )}
            <button
              onClick={handleCommission}
              disabled={ordering}
              className="w-full bg-electric text-primary-foreground px-6 py-5 label hover:bg-ink transition-colors disabled:opacity-50"
            >
              {ordering ? 'Adding to Cart...' : 'Add to Cart \u2192'}
            </button>
            <Link
              to="/builder"
              className="block w-full text-center border border-surface px-6 py-5 label hover:bg-surface/30 transition-colors"
            >
              Modify Configuration
            </Link>
          </div>

          <div className="px-6 lg:px-8 py-6 border-t border-surface/60 space-y-2">
            <div className="flex justify-between label text-ink/50">
              <span>Lead Time</span><span className="text-ink">7&ndash;10 Days</span>
            </div>
            <div className="flex justify-between label text-ink/50">
              <span>Burn-in</span><span className="text-ink">48 Hours</span>
            </div>
            <div className="flex justify-between label text-ink/50">
              <span>Warranty</span><span className="text-ink">10 Years</span>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
