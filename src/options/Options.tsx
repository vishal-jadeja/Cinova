import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, RotateCcw, Save, X } from 'lucide-react';
import { Goal, GoalStore } from '../types';
import { getStore, setStore } from '../utils/storage';

const MAX_GOALS = 10;

interface GoalDraft {
  id: string;
  text: string;
  completed: boolean;
  description: string;
}

type Setter = React.Dispatch<React.SetStateAction<GoalDraft[]>>;

function emptyDraft(): GoalDraft {
  return { id: crypto.randomUUID(), text: '', completed: false, description: '' };
}

function draftsFromGoals(goals: Goal[]): GoalDraft[] {
  const result = goals.map((g) => ({
    id: g.id, text: g.text, completed: g.completed, description: g.description ?? '',
  }));
  return result.length > 0 ? result : [emptyDraft()];
}

function buildGoals(drafts: GoalDraft[]): Goal[] {
  return drafts.filter((d) => d.text.trim()).map((d) => ({
    id: d.id,
    text: d.text.trim(),
    completed: d.completed,
    ...(d.description.trim() ? { description: d.description.trim() } : {}),
  }));
}

const CATEGORIES = [
  { key: 'weekly' as const, label: 'WEEKLY GOALS', note: 'resets every Monday' },
  { key: 'monthly' as const, label: 'MONTHLY GOALS', note: '' },
  { key: 'yearly' as const, label: 'YEARLY GOALS', note: '' },
];

const inputBase: React.CSSProperties = {
  background: '#13161F', border: '1px solid #1E2130', color: '#E8EAF0',
  fontSize: '14px', padding: '11px 14px', borderRadius: '4px', outline: 'none',
  fontFamily: 'Inter, sans-serif', transition: 'border-color 150ms', width: '100%',
};

export default function Options() {
  const [store, setLocalStore] = useState<GoalStore | null>(null);
  const [weekly, setWeekly] = useState<GoalDraft[]>([emptyDraft()]);
  const [monthly, setMonthly] = useState<GoalDraft[]>([emptyDraft()]);
  const [yearly, setYearly] = useState<GoalDraft[]>([emptyDraft()]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  useEffect(() => {
    getStore().then((s) => {
      setLocalStore(s);
      const w = draftsFromGoals(s.weekly);
      const mo = draftsFromGoals(s.monthly);
      const y = draftsFromGoals(s.yearly);
      setWeekly(w);
      setMonthly(mo);
      setYearly(y);
      // Auto-expand goals that already have description content
      const withContent = new Set([...w, ...mo, ...y].filter((d) => d.description.trim()).map((d) => d.id));
      setExpanded(withContent);
    });
  }, []);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function updateDraft(setter: Setter, id: string, patch: Partial<Omit<GoalDraft, 'id'>>) {
    setter((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function addDraft(setter: Setter) {
    const draft = emptyDraft();
    setter((prev) => [...prev, draft]);
    // Auto-open description panel on new goal
    setExpanded((prev) => new Set([...prev, draft.id]));
  }

  function removeDraft(setter: Setter, id: string) {
    setter((prev) => { const next = prev.filter((d) => d.id !== id); return next.length === 0 ? [emptyDraft()] : next; });
    setExpanded((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  async function handleSave() {
    if (!store) return;
    const newStore: GoalStore = {
      ...store,
      weekly: buildGoals(weekly),
      monthly: buildGoals(monthly),
      yearly: buildGoals(yearly),
    };
    await setStore(newStore);
    setLocalStore(newStore);
    setToast('saved');
    setTimeout(() => setToast(''), 2500);
  }

  async function handleResetWeekly() {
    if (!store) return;
    const newStore: GoalStore = { ...store, weekly: store.weekly.map((g) => ({ ...g, completed: false })) };
    await setStore(newStore);
    setLocalStore(newStore);
    setToast('reset');
    setTimeout(() => setToast(''), 2500);
  }

  if (!store) {
    return (
      <div style={{ minHeight: '100vh', background: '#0C0E14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '16px', height: '16px', border: '1.5px solid #E8A838', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  const stateMap = {
    weekly: { values: weekly, setter: setWeekly },
    monthly: { values: monthly, setter: setMonthly },
    yearly: { values: yearly, setter: setYearly },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0C0E14', color: '#E8EAF0', position: 'relative', overflow: 'hidden' }}>
      {/* Atmospheric gradient background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 130% 55% at 50% -5%, rgba(72,32,160,0.10) 0%, transparent 60%),
          radial-gradient(ellipse 70% 55% at 88% 92%, rgba(16,76,156,0.08) 0%, transparent 55%)
        `,
      }} />

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: 700, color: '#E8EAF0', letterSpacing: '-0.01em', margin: '0 0 5px' }}>Cinova</h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#5A6080', margin: 0 }}>Your goals. Every tab.</p>
        </div>

        <div style={{ height: '1px', background: '#1E2130', marginBottom: '28px' }} />

        {CATEGORIES.map(({ key, label, note }) => {
          const { values, setter } = stateMap[key];
          const atMax = values.length >= MAX_GOALS;

          return (
            <div key={key} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#5A6080', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  {label}
                </span>
                {note && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#5A6080', letterSpacing: '0.06em' }}>({note})</span>
                )}
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#5A6080', marginLeft: 'auto', opacity: 0.4 }}>
                  {values.filter((d) => d.text.trim()).length}/{MAX_GOALS}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {values.map((draft, i) => {
                  const isExpanded = expanded.has(draft.id);
                  const hasContent = draft.description.trim().length > 0;

                  return (
                    <div key={draft.id} style={{ border: '1px solid #1E2130', borderRadius: '4px', overflow: 'hidden' }}>
                      {/* Goal text row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#13161F', padding: '0 12px' }}>
                        <input
                          type="text"
                          value={draft.text}
                          onChange={(e) => updateDraft(setter, draft.id, { text: e.target.value })}
                          placeholder={`Goal ${i + 1}`}
                          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E8EAF0', fontSize: '14px', padding: '11px 0', fontFamily: 'Inter, sans-serif' }}
                        />
                        {/* Description toggle — accent when has content */}
                        <button
                          type="button"
                          onClick={() => toggleExpanded(draft.id)}
                          style={{
                            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: hasContent ? '#E8A838' : '#5A6080',
                            fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.06em',
                            padding: '4px 6px', transition: 'color 150ms',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#E8A838')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = hasContent ? '#E8A838' : '#5A6080')}
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? 'Notes' : hasContent ? 'Notes' : 'Notes'}
                        </button>
                        {values.length > 1 && (
                          <button type="button" onClick={() => removeDraft(setter, draft.id)}
                            style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#5A6080', padding: '4px', display: 'flex', transition: 'color 150ms' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#E05A5A')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#5A6080')}>
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {/* Description panel — links typed inline, URLs linkified on display */}
                      {isExpanded && (
                        <div style={{ padding: '14px 16px', borderTop: '1px solid #1E2130', background: 'rgba(255,255,255,0.015)' }}>
                          <textarea
                            value={draft.description}
                            onChange={(e) => updateDraft(setter, draft.id, { description: e.target.value })}
                            placeholder="Notes, context, or paste links — URLs become clickable on your new tab"
                            rows={3}
                            style={{ ...inputBase, resize: 'vertical', borderRadius: '4px', fontSize: '13px', lineHeight: 1.6, padding: '10px 12px' }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#E8A838')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = '#1E2130')}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!atMax ? (
                <button type="button" onClick={() => addDraft(setter)}
                  style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#5A6080', padding: 0, fontFamily: 'Inter, sans-serif', fontSize: '12px', transition: 'color 150ms' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#E8A838')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#5A6080')}>
                  <Plus size={13} /> Add goal
                </button>
              ) : (
                <p style={{ marginTop: '10px', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#5A6080', opacity: 0.5, margin: '10px 0 0' }}>
                  Maximum {MAX_GOALS} goals reached
                </p>
              )}
            </div>
          );
        })}

        {/* Save */}
        <div style={{ marginBottom: '32px' }}>
          <button onClick={handleSave}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#E8A838', color: '#0C0E14', border: 'none', padding: '11px 22px', fontSize: '14px', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', transition: 'background 150ms', letterSpacing: '0.01em', fontFamily: 'Inter, sans-serif' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F2B540')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#E8A838')}>
            <Save size={14} />
            Save Goals
          </button>
        </div>

        <div style={{ height: '1px', background: '#1E2130', marginBottom: '28px' }} />

        {/* Danger zone */}
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#E05A5A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px', marginTop: 0 }}>
            ⚠ Reset Weekly Goal Progress
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#5A6080', lineHeight: 1.65, marginBottom: '16px', marginTop: 0 }}>
            Clears all weekly completion checkmarks. Your goal text is preserved. This action cannot be undone.
          </p>
          <button onClick={handleResetWeekly}
            style={{ background: 'transparent', color: '#E05A5A', border: '1px solid rgba(224,90,90,0.35)', padding: '9px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', transition: 'all 150ms', letterSpacing: '0.01em', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(224,90,90,0.08)'; e.currentTarget.style.borderColor = '#E05A5A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(224,90,90,0.35)'; }}>
            <RotateCcw size={13} />
            Reset weekly progress
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#13161F', border: '1px solid #1E2130', padding: '10px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none', zIndex: 50 }}>
          <span style={{ color: '#4CAF82', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', lineHeight: 1 }}>✓</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#E8EAF0', letterSpacing: '0.06em' }}>
            {toast === 'saved' ? 'Goals saved' : 'Progress reset'}
          </span>
        </div>
      )}
    </div>
  );
}
