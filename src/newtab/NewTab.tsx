import React, { useEffect, useRef, useState } from 'react';
import { Goal, GoalStore } from '../types';
import { getStore, setStore } from '../utils/storage';
import logoFull from '/CinovaWithTextLogo.png';

interface Draft { id: string; text: string; description: string; }
function emptyDraft(): Draft { return { id: crypto.randomUUID(), text: '', description: '' }; }
function extractUrls(text: string): string[] {
  const m = text.match(/https?:\/\/[^\s]+/g);
  return m ? [...new Set(m)] : [];
}

const T = {
  text: '#e8e8e8',
  muted: 'rgba(232,232,232,0.36)',
  border: 'rgba(232,232,232,0.07)',
  border2: 'rgba(232,232,232,0.14)',
  surface: 'rgba(18,18,18,0.62)',
  accent: '#e8e8e8',
  accentText: '#0d0d0d',
};
const FONT_SANS = "'Space Grotesk', sans-serif";
const FONT_MONO = "'Space Mono', monospace";
const BG_URL = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80';
const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_GOALS = 10;

function todayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

// ─── Background ───────────────────────────────────────────────────────────────
function Background() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: '-40px', backgroundImage: `url('${BG_URL}')`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(34px)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.76)' }} />
    </div>
  );
}

// ─── Week Tracker ─────────────────────────────────────────────────────────────
function WeekTracker({ center = false }: { center?: boolean }) {
  const today = todayIndex();
  const daysLeft = 6 - today;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: center ? 'center' : 'flex-end', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        {DAY_NAMES.map((day, i) => {
          const isPast = i < today;
          const isToday = i === today;
          const barColor = (isPast || isToday) ? '#E8A838' : T.border2;
          const lblColor = isPast ? T.text : isToday ? '#E8A838' : T.muted;
          return (
            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', width: '30px' }}>
              <div style={{ width: '100%', height: '4px', borderRadius: '2px', display: 'flex', overflow: 'hidden' }}>
                <div style={{ flex: 1, background: barColor }} />
                <div style={{ flex: 1, background: barColor, animation: isToday ? 'pulseAmber 2s ease-in-out infinite' : 'none' }} />
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: '8px', color: lblColor, letterSpacing: '0.06em', lineHeight: 1, fontWeight: isToday ? 700 : 400 }}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
      <span style={{ fontFamily: FONT_MONO, fontSize: '9px', color: T.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {daysLeft === 0 ? 'Last day of the week' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left this week`}
      </span>
    </div>
  );
}

// ─── Linkify ─────────────────────────────────────────────────────────────────
function linkify(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /https?:\/\/[^\s]+/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const url = m[0];
    parts.push(<a key={m.index} href={url} target="_blank" rel="noopener noreferrer"
      style={{ color: '#E8A838', textDecoration: 'underline', textUnderlineOffset: '2px' }}
      onClick={e => e.stopPropagation()}>{url}</a>);
    last = m.index + url.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ─── Checkbox ────────────────────────────────────────────────────────────────
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div style={{
      width: '16px', height: '16px', minWidth: '16px', marginTop: '1px',
      borderRadius: '50%',
      border: `1.5px solid ${checked ? 'transparent' : T.border2}`,
      background: checked ? T.text : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s', flexShrink: 0,
    }}>
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none" style={{ animation: 'checkAppear 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <path d="M1 3L3.5 5.5L8 1" stroke="#0d0d0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ─── GoalCard (shared by Onboarding + reused pattern in Options) ──────────────
function GoalCard({ draft, index, canRemove, onUpdate, onRemove, autoFocusNotes }: {
  draft: Draft;
  index: number;
  canRemove: boolean;
  onUpdate: (patch: Partial<Draft>) => void;
  onRemove: () => void;
  autoFocusNotes: boolean;
}) {
  const [expanded, setExpanded] = useState(autoFocusNotes);
  const [focused, setFocused] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const hasNotes = draft.description.trim().length > 0;
  const urls = extractUrls(draft.description);

  useEffect(() => {
    if (expanded && autoFocusNotes && notesRef.current) notesRef.current.focus();
  }, [expanded, autoFocusNotes]);

  return (
    <div style={{ border: `1px solid ${focused ? 'rgba(232,232,232,0.24)' : 'rgba(232,232,232,0.1)'}`, borderRadius: '6px', background: 'rgba(255,255,255,0.03)', overflow: 'hidden', transition: 'border-color 180ms', animation: 'fadeIn 0.18s ease-out' }}>
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
        <button type="button" onClick={() => setExpanded(v => !v)} title={expanded ? 'Hide notes' : 'Add notes'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px', color: hasNotes ? T.text : T.muted, opacity: hasNotes ? 0.8 : 0.5, transition: 'opacity 150ms', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 2.5h9M2 5.5h9M2 8.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {hasNotes && !expanded && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: T.text, opacity: 0.6 }} />}
        </button>
        {canRemove && (
          <button type="button" onClick={onRemove}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: T.muted, fontSize: '18px', lineHeight: 1, opacity: 0.45, flexShrink: 0, transition: 'opacity 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.45')}>×</button>
        )}
      </div>

      {/* Notes panel */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 14px 12px', animation: 'slideDown 0.2s ease-out' }}>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 600, color: T.muted, marginBottom: '8px', fontFamily: FONT_MONO }}>Notes</div>
          <textarea
            ref={notesRef}
            value={draft.description}
            onChange={e => onUpdate({ description: e.target.value })}
            placeholder="Context, links, resources — URLs become clickable on your new tab"
            rows={3}
            style={{ display: 'block', width: '100%', background: 'none', border: 'none', outline: 'none', padding: 0, fontSize: '13px', color: 'rgba(232,232,232,0.75)', letterSpacing: '0.01em', fontFamily: FONT_SANS, resize: 'vertical', lineHeight: 1.65 }}
          />
          {urls.length > 0 && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: 'rgba(232,232,232,0.06) 1px solid' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.muted, fontFamily: FONT_MONO, marginBottom: '6px', opacity: 0.6 }}>Links</div>
              {urls.map(url => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', fontSize: '12px', color: '#E8A838', marginBottom: '3px', wordBreak: 'break-all', textDecoration: 'none', opacity: 0.85, letterSpacing: '0.01em' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}>↗ {url}</a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
type DraftSetter = React.Dispatch<React.SetStateAction<Draft[]>>;

function Onboarding({ onComplete }: { onComplete: (patch: Partial<GoalStore>) => void }) {
  const [weekly, setWeekly] = useState<Draft[]>([emptyDraft()]);
  const [monthly, setMonthly] = useState<Draft[]>([emptyDraft()]);
  const [yearly, setYearly] = useState<Draft[]>([emptyDraft()]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  function addDraft(setter: DraftSetter) {
    if (setter === setWeekly && weekly.length >= MAX_GOALS) return;
    if (setter === setMonthly && monthly.length >= MAX_GOALS) return;
    if (setter === setYearly && yearly.length >= MAX_GOALS) return;
    const d = emptyDraft();
    setter(prev => [...prev, d]);
    setNewIds(prev => new Set([...prev, d.id]));
  }
  function removeDraft(setter: DraftSetter, id: string) {
    setter(prev => { const n = prev.filter(d => d.id !== id); return n.length ? n : [emptyDraft()]; });
  }
  function updateDraft(setter: DraftSetter, id: string, patch: Partial<Draft>) {
    setter(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }
  function buildGoals(drafts: Draft[]): Goal[] {
    return drafts.filter(d => d.text.trim()).map(d => ({
      id: d.id, text: d.text.trim(), completed: false,
      ...(d.description.trim() ? { description: d.description.trim() } : {}),
    }));
  }

  const hasWeekly = weekly.some(d => d.text.trim());

  const sections = [
    { label: 'This Week', drafts: weekly, setter: setWeekly },
    { label: 'This Month', drafts: monthly, setter: setMonthly },
    { label: 'This Year', drafts: yearly, setter: setYearly },
  ];

  return (
    <div style={{ minHeight: '100vh', position: 'relative', color: T.text, fontFamily: FONT_SANS, overflowY: 'auto' }}>
      <Background />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', padding: '52px 40px 80px' }}>

        <div style={{ marginBottom: '52px' }}>
          <img src={logoFull} alt="Cinova" style={{ height: '24px', display: 'block', marginBottom: '14px', opacity: 0.9 }} />
          <h1 style={{ margin: '0 0 10px', fontSize: '26px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>Your goals</h1>
          <p style={{ margin: 0, fontSize: '13px', color: T.muted, lineHeight: 1.5 }}>Set your goals once. Face them every day.</p>
        </div>

        {sections.map(({ label, drafts, setter }) => (
          <div key={label} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700, color: T.muted, fontFamily: FONT_MONO }}>{label}</span>
              <span style={{ fontSize: '10px', color: T.muted, opacity: 0.4, fontFamily: FONT_MONO }}>{drafts.filter(d => d.text.trim()).length}/{MAX_GOALS}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {drafts.map((draft, i) => (
                <GoalCard
                  key={draft.id}
                  draft={draft}
                  index={i}
                  canRemove={drafts.length > 1}
                  onUpdate={patch => updateDraft(setter, draft.id, patch)}
                  onRemove={() => removeDraft(setter, draft.id)}
                  autoFocusNotes={newIds.has(draft.id)}
                />
              ))}
            </div>
            {drafts.length < MAX_GOALS && (
              <button type="button" onClick={() => addDraft(setter)}
                style={{ marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '12px', letterSpacing: '0.06em', padding: '6px 0', fontFamily: FONT_SANS, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Add goal
              </button>
            )}
          </div>
        ))}

        <div style={{ height: '1px', background: T.border, marginBottom: '28px' }} />

        <button
          onClick={() => { if (hasWeekly) onComplete({ weekly: buildGoals(weekly), monthly: buildGoals(monthly), yearly: buildGoals(yearly), onboardingComplete: true }); }}
          disabled={!hasWeekly}
          style={{ padding: '12px 28px', background: hasWeekly ? T.accent : T.border2, color: hasWeekly ? T.accentText : T.muted, border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '4px', cursor: hasWeekly ? 'pointer' : 'default', fontFamily: FONT_SANS, transition: 'background 350ms ease, color 350ms ease' }}>
          Set my goals
        </button>

      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function useTime() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const iv = setInterval(() => setT(new Date()), 1000); return () => clearInterval(iv); }, []);
  return t;
}

function SidebarSection({ label, goals, onToggle }: { label: string; goals: Goal[]; onToggle: (id: string) => void }) {
  const visible = goals.filter(g => g.text.trim());
  if (visible.length === 0) return null;
  return (
    <div style={{ marginBottom: '26px' }}>
      <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700, color: T.muted, marginBottom: '12px' }}>{label}</div>
      {visible.map(g => (
        <div key={g.id} onClick={() => onToggle(g.id)}
          style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '5px 8px', margin: '0 -8px', cursor: 'pointer', borderRadius: '4px', transition: 'background 150ms' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <Checkbox checked={g.completed} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: '12.5px', lineHeight: 1.42, opacity: g.completed ? 0.3 : 1, textDecoration: g.completed ? 'line-through' : 'none', transition: 'opacity 0.15s' }}>
              {g.text}
            </span>
            {g.description && !g.completed && (
              <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: 'rgba(232,232,232,0.65)', lineHeight: 1.55, wordBreak: 'break-word' }}>
                {linkify(g.description)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ store, onToggleGoal }: {
  store: GoalStore;
  onToggleGoal: (cat: 'weekly' | 'monthly' | 'yearly', id: string) => void;
}) {
  const now = useTime();
  const pad = (n: number) => String(n).padStart(2, '0');
  const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const ss = pad(now.getSeconds());
  const dateStr = `${WEEK_LONG[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', color: T.text, fontFamily: FONT_SANS, animation: 'fadeIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
      <Background />

      {/* Header strip */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', padding: '22px 56px 18px 56px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <img src={logoFull} alt="Cinova" style={{ height: '26px', display: 'block', opacity: 0.92 }} />
      </div>

      {/* Content row */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', minHeight: 0 }}>

        {/* Sidebar */}
        <div style={{ position: 'relative', width: '256px', minWidth: '256px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${T.border}`, background: T.surface }}>
          {/* Sidebar header with edit icon top-right */}
          <button onClick={() => { window.location.href = chrome.runtime.getURL('src/options/index.html'); }}
            title="Edit goals"
            style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', opacity: 0.6, transition: 'opacity 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 2L12 4.5L5.5 11H3V8.5L9.5 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 3.5L10.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
          <div style={{ flex: 1, padding: '20px 20px', overflowY: 'auto', minHeight: 0 }}>
            <SidebarSection label="This Week" goals={store.weekly} onToggle={id => onToggleGoal('weekly', id)} />
            <SidebarSection label="This Month" goals={store.monthly} onToggle={id => onToggleGoal('monthly', id)} />
            <SidebarSection label="This Year" goals={store.yearly} onToggle={id => onToggleGoal('yearly', id)} />
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0', padding: '40px' }}>
          {/* WeekTracker — top-right of main area, outside header */}
          <div style={{ position: 'absolute', top: '24px', right: '40px' }}>
            <WeekTracker />
          </div>
          <div style={{ marginTop: '-40px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', userSelect: 'none' }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: '92px', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>{hm}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: '46px', fontWeight: 400, letterSpacing: '-0.02em', opacity: 0.32, paddingLeft: '4px' }}>:{ss}</span>
            </div>
            <div style={{ fontSize: '12px', letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', fontWeight: 500, marginTop: '10px', marginBottom: '22px' }}>{dateStr}</div>
            <form onSubmit={e => { e.preventDefault(); const q = search.trim(); if (q) window.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`; }}
              style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
              <svg data-dc-tpl="77" width="16" height="16" viewBox="0 0 16 16" fill="none" data-om-id="6c163b89:82" style={{ flexShrink: 0, position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)' }}>
                <circle data-dc-tpl="78" cx="6.5" cy="6.5" r="4.5" stroke="#5A6080" strokeWidth="1.2" data-om-id="6c163b89:83"></circle>
                <path data-dc-tpl="79" d="M10.5 10.5L13.5 13.5" stroke="#5A6080" strokeWidth="1.2" strokeLinecap="round" data-om-id="6c163b89:84"></path>
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search Google"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{ width: '100%', padding: '13px 16px 13px 40px', background: T.surface, border: `1px solid ${searchFocused ? 'rgba(232,232,232,0.28)' : T.border2}`, fontSize: '14px', color: T.text, borderRadius: '4px', letterSpacing: '0.01em', fontFamily: FONT_SANS, outline: 'none', transition: 'border-color 200ms' }} />
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function NewTab() {
  const [store, setLocalStore] = useState<GoalStore | null>(null);
  useEffect(() => { getStore().then(setLocalStore); }, []);

  async function handleOnboardingComplete(patch: Partial<GoalStore>) {
    const newStore: GoalStore = { ...store!, ...patch };
    await setStore(newStore); setLocalStore(newStore);
  }
  async function handleToggleGoal(cat: 'weekly' | 'monthly' | 'yearly', id: string) {
    const newStore: GoalStore = { ...store!, [cat]: store![cat].map(g => g.id === id ? { ...g, completed: !g.completed } : g) };
    await setStore(newStore); setLocalStore(newStore);
  }

  if (!store) return <div style={{ position: 'fixed', inset: 0, background: '#0d0d0d' }}><Background /></div>;
  if (!store.onboardingComplete) return <Onboarding onComplete={handleOnboardingComplete} />;
  return <Dashboard store={store} onToggleGoal={handleToggleGoal} />;
}
