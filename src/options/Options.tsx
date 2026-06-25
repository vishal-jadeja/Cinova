import React, { useEffect, useRef, useState } from 'react';
import { Goal, GoalStore } from '../types';
import { getStore, setStore } from '../utils/storage';
import logoMark from '/CinovaLogo.png';

function extractUrls(text: string): string[] {
  const m = text.match(/https?:\/\/[^\s]+/g);
  return m ? [...new Set(m)] : [];
}

const MAX_GOALS = 10;
const FONT_SANS = "'Space Grotesk', sans-serif";
const FONT_MONO = "'Space Mono', monospace";
const BG_URL = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80';

const T = {
  text: '#e8e8e8',
  muted: 'rgba(232,232,232,0.36)',
  border: 'rgba(232,232,232,0.07)',
  border2: 'rgba(232,232,232,0.14)',
  surface: 'rgba(18,18,18,0.62)',
  surfaceHover: 'rgba(255,255,255,0.04)',
  accent: '#e8e8e8',
  accentText: '#0d0d0d',
  cardBorder: 'rgba(232,232,232,0.1)',
  cardBorderFocus: 'rgba(232,232,232,0.24)',
};

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
  const r = goals.map(g => ({ id: g.id, text: g.text, completed: g.completed, description: g.description ?? '' }));
  return r.length > 0 ? r : [emptyDraft()];
}
function buildGoals(drafts: GoalDraft[]): Goal[] {
  return drafts.filter(d => d.text.trim()).map(d => ({
    id: d.id, text: d.text.trim(), completed: d.completed,
    ...(d.description.trim() ? { description: d.description.trim() } : {}),
  }));
}

// ─── Goal Card — goal text + notes as one visual unit ─────────────────────────
function GoalCard({
  draft, index, isExpanded, onUpdate, onRemove, onToggleExpanded, canRemove, autoFocusNotes,
}: {
  draft: GoalDraft;
  index: number;
  isExpanded: boolean;
  onUpdate: (patch: Partial<Omit<GoalDraft, 'id'>>) => void;
  onRemove: () => void;
  onToggleExpanded: () => void;
  canRemove: boolean;
  autoFocusNotes: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const hasNotes = draft.description.trim().length > 0;

  useEffect(() => {
    if (isExpanded && autoFocusNotes && notesRef.current) {
      notesRef.current.focus();
    }
  }, [isExpanded, autoFocusNotes]);

  return (
    <div style={{
      border: `1px solid ${focused ? T.cardBorderFocus : T.cardBorder}`,
      borderRadius: '6px',
      background: 'rgba(255,255,255,0.03)',
      overflow: 'hidden',
      transition: 'border-color 180ms',
      animation: 'fadeIn 0.18s ease-out',
    }}>
      {/* Goal text row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', gap: '8px' }}>
        <input
          type="text"
          value={draft.text}
          placeholder={`Goal ${index + 1}`}
          onChange={e => onUpdate({ text: e.target.value })}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '13px 0', fontSize: '14px', color: T.text, letterSpacing: '0.01em', fontFamily: FONT_SANS }}
        />

        {/* Notes toggle */}
        <button
          type="button"
          onClick={onToggleExpanded}
          title={isExpanded ? 'Hide notes' : 'Add notes'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px', color: hasNotes ? T.text : T.muted, opacity: hasNotes ? 0.8 : 0.5, transition: 'opacity 150ms', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 2.5h9M2 5.5h9M2 8.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {hasNotes && !isExpanded && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: T.text, opacity: 0.6 }} />}
        </button>

        {/* Remove */}
        {canRemove && (
          <button type="button" onClick={onRemove}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: T.muted, fontSize: '18px', lineHeight: 1, opacity: 0.45, flexShrink: 0, transition: 'opacity 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.45')}>×</button>
        )}
      </div>

      {/* Notes section — same card, visually connected */}
      {isExpanded && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 14px 12px', animation: 'slideDown 0.2s ease-out' }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 600, color: T.muted, marginBottom: '8px', fontFamily: FONT_MONO }}>
            Notes
          </div>
          <textarea
            ref={notesRef}
            value={draft.description}
            onChange={e => onUpdate({ description: e.target.value })}
            placeholder="Context, links, resources — URLs become clickable on your new tab"
            rows={3}
            style={{ display: 'block', width: '100%', background: 'none', border: 'none', outline: 'none', padding: 0, fontSize: '13px', color: 'rgba(232,232,232,0.75)', letterSpacing: '0.01em', fontFamily: FONT_SANS, resize: 'vertical', lineHeight: 1.65 }}
          />
          {/* Link preview — show URLs as clickable amber links */}
          {extractUrls(draft.description).length > 0 && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid rgba(232,232,232,0.06)` }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.muted, fontFamily: FONT_MONO, marginBottom: '6px', opacity: 0.6 }}>Links</div>
              {extractUrls(draft.description).map(url => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', fontSize: '12px', color: '#E8A838', marginBottom: '3px', wordBreak: 'break-all', textDecoration: 'none', opacity: 0.85, letterSpacing: '0.01em' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}>
                  ↗ {url}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────
function CategorySection({
  label, values, setter, expanded, setExpanded,
}: {
  label: string;
  values: GoalDraft[];
  setter: Setter;
  expanded: Set<string>;
  setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function updateDraft(id: string, patch: Partial<Omit<GoalDraft, 'id'>>) {
    setter(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }

  function addDraft() {
    const d = emptyDraft();
    setter(prev => [...prev, d]);
    setExpanded(prev => new Set([...prev, d.id]));
    setNewIds(prev => new Set([...prev, d.id]));
  }

  function removeDraft(id: string) {
    setter(prev => { const n = prev.filter(d => d.id !== id); return n.length === 0 ? [emptyDraft()] : n; });
    setExpanded(prev => { const n = new Set(prev); n.delete(id); return n; });
    setNewIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  const atMax = values.length >= MAX_GOALS;

  return (
    <div style={{ marginBottom: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700, color: T.muted, fontFamily: FONT_MONO }}>
          {label}
        </span>
        <span style={{ fontSize: '10px', color: T.muted, opacity: 0.4, fontFamily: FONT_MONO }}>
          {values.filter(d => d.text.trim()).length}/{MAX_GOALS}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {values.map((draft, i) => (
          <GoalCard
            key={draft.id}
            draft={draft}
            index={i}
            isExpanded={expanded.has(draft.id)}
            hasNotes={draft.description.trim().length > 0}
            onUpdate={patch => updateDraft(draft.id, patch)}
            onRemove={() => removeDraft(draft.id)}
            onToggleExpanded={() => toggleExpanded(draft.id)}
            canRemove={values.length > 1}
            autoFocusNotes={newIds.has(draft.id)}
          />
        ))}
      </div>

      {!atMax ? (
        <button type="button" onClick={addDraft}
          style={{ marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '12px', letterSpacing: '0.06em', padding: '6px 0', fontFamily: FONT_SANS, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Add goal
        </button>
      ) : (
        <p style={{ marginTop: '10px', fontSize: '11px', color: T.muted, opacity: 0.4, fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>
          Max {MAX_GOALS} goals
        </p>
      )}
    </div>
  );
}

// ─── Options Root ─────────────────────────────────────────────────────────────
export default function Options() {
  const [store, setLocalStore] = useState<GoalStore | null>(null);
  const [weekly, setWeekly] = useState<GoalDraft[]>([emptyDraft()]);
  const [monthly, setMonthly] = useState<GoalDraft[]>([emptyDraft()]);
  const [yearly, setYearly] = useState<GoalDraft[]>([emptyDraft()]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [savedVisible, setSavedVisible] = useState(false);

  useEffect(() => {
    getStore().then(s => {
      setLocalStore(s);
      const w = draftsFromGoals(s.weekly);
      const mo = draftsFromGoals(s.monthly);
      const y = draftsFromGoals(s.yearly);
      setWeekly(w); setMonthly(mo); setYearly(y);
      setExpanded(new Set([...w, ...mo, ...y].filter(d => d.description.trim()).map(d => d.id)));
    });
  }, []);

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
    setSavedVisible(true);
    setTimeout(() => setSavedVisible(false), 2500);
  }

  async function handleResetWeekly() {
    if (!store) return;
    const newStore: GoalStore = { ...store, weekly: store.weekly.map(g => ({ ...g, completed: false })) };
    await setStore(newStore);
    setLocalStore(newStore);
  }

  if (!store) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '16px', height: '16px', border: '1.5px solid #e8e8e8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  const sections = [
    { key: 'weekly' as const, label: 'This Week', values: weekly, setter: setWeekly },
    { key: 'monthly' as const, label: 'This Month', values: monthly, setter: setMonthly },
    { key: 'yearly' as const, label: 'This Year', values: yearly, setter: setYearly },
  ];

  return (
    <div style={{ minHeight: '100vh', position: 'relative', color: T.text, fontFamily: FONT_SANS, overflowY: 'auto' }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: '-40px', backgroundImage: `url('${BG_URL}')`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(34px)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.76)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', padding: '52px 40px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <img src={logoMark} alt="Cinova" style={{ height: '24px', display: 'block', opacity: 0.9 }} />
          <button onClick={() => { window.location.href = chrome.runtime.getURL('src/newtab/index.html'); }}
            style={{ background: 'none', border: `1px solid ${T.border2}`, padding: '8px 16px', fontSize: '11px', color: T.muted, letterSpacing: '0.06em', borderRadius: '4px', fontWeight: 500, cursor: 'pointer', fontFamily: FONT_SANS, transition: 'opacity 150ms, border-color 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,232,232,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border2)}>
            ← Back
          </button>
        </div>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '24px' }}>Goals</h1>

        {/* Goal sections — vertical stacked */}
        {sections.map(({ key, label, values, setter }) => (
          <CategorySection
            key={key}
            label={label}
            values={values}
            setter={setter}
            expanded={expanded}
            setExpanded={setExpanded}
          />
        ))}

        {/* Divider */}
        <div style={{ height: '1px', background: T.border, marginBottom: '28px' }} />

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '52px' }}>
          <button onClick={handleSave}
            style={{ padding: '12px 28px', background: T.accent, color: T.accentText, border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', fontFamily: FONT_SANS }}>
            Save changes
          </button>
          <span style={{ fontSize: '12px', color: T.muted, opacity: savedVisible ? 1 : 0, transition: 'opacity 0.4s', letterSpacing: '0.06em' }}>
            ✓ Saved
          </span>
        </div>

        {/* Reset weekly */}
        <div style={{ padding: '22px 24px', border: `1px solid ${T.border}`, borderRadius: '6px', display: 'inline-flex', flexDirection: 'column', gap: '8px', minWidth: '320px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em' }}>Reset weekly progress</div>
          <div style={{ fontSize: '13px', color: T.muted, lineHeight: 1.55 }}>Unchecks all weekly goals without deleting them.</div>
          <button onClick={handleResetWeekly}
            style={{ marginTop: '4px', padding: '9px 18px', background: 'none', border: `1px solid ${T.border2}`, fontSize: '11px', fontWeight: 600, color: T.text, letterSpacing: '0.06em', borderRadius: '4px', alignSelf: 'flex-start', cursor: 'pointer', fontFamily: FONT_SANS, transition: 'opacity 150ms, border-color 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,232,232,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border2)}>
            Reset weekly progress
          </button>
        </div>
      </div>
    </div>
  );
}
