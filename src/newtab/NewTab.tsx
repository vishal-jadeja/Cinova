import React, { useEffect, useRef, useState } from 'react';
import { Goal, GoalStore, PomodoroState, PomodoroSettings, Reward } from '../types';
import { getStore, setStore, getPomodoroState, setPomodoroState } from '../utils/storage';
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
const BG_URLS = [
  BG_URL,
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1439853949212-36089c9a8957?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&w=1920&q=80',
];
const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_GOALS = 10;

function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
}

function maybeRotateBackground(store: GoalStore): GoalStore {
  if (!store.autoBackground) return store;
  const weekKey = getISOWeekKey(new Date());
  if (store.lastBackgroundChange === weekKey) return store;
  const idx = ((store.backgroundIndex ?? -1) + 1) % BG_URLS.length;
  return { ...store, backgroundImage: BG_URLS[idx], backgroundIndex: idx, lastBackgroundChange: weekKey };
}

function todayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

// ─── Background ───────────────────────────────────────────────────────────────
function Background({ url }: { url?: string }) {
  const src = url || BG_URL;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: '-40px', backgroundImage: `url('${src}')`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(34px)' }} />
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
              {/* <span style={{ fontSize: '10px', color: T.muted, opacity: 0.4, fontFamily: FONT_MONO }}>{drafts.filter(d => d.text.trim()).length}/{MAX_GOALS}</span> */}
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

// ─── Pomodoro ─────────────────────────────────────────────────────────────────
function playPing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch { /* ignore */ }
}

function PomodoroTimer({ settings }: { settings?: PomodoroSettings }) {
  const workDur = settings?.workDuration ?? 25;
  const shortBreakDur = settings?.shortBreak ?? 5;
  const longBreakDur = settings?.longBreak ?? 15;
  const sessionsBeforeLong = settings?.sessionsBeforeLong ?? 4;

  const [pstate, setPstate] = useState<PomodoroState>({ mode: 'idle', endTime: 0, running: false, sessionsCompleted: 0 });
  const prevModeRef = useRef<PomodoroState['mode']>('idle');
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    getPomodoroState().then(s => { setPstate(s); prevModeRef.current = s.mode; });
    const handler = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area !== 'local' || !changes['cinova-pomodoro']) return;
      const next: PomodoroState = changes['cinova-pomodoro'].newValue;
      if (!next) return;
      if (prevModeRef.current !== 'idle' && next.mode !== prevModeRef.current) playPing();
      prevModeRef.current = next.mode;
      setPstate(next);
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  useEffect(() => {
    if (!pstate.running || pstate.mode === 'idle') { setRemaining(0); return; }
    function tick() { setRemaining(Math.max(0, pstate.endTime - Date.now())); }
    tick();
    const iv = setInterval(tick, 500);
    return () => clearInterval(iv);
  }, [pstate]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const timeStr = pstate.mode === 'idle'
    ? `${pad2(workDur)}:00`
    : pstate.running
      ? `${pad2(mins)}:${pad2(secs)}`
      : `${pad2(Math.floor((pstate.endTime - (pstate.pausedAt ?? pstate.endTime)) / 60000))}:${pad2(Math.floor(((pstate.endTime - (pstate.pausedAt ?? pstate.endTime)) % 60000) / 1000))}`;

  const modeLabel = { idle: 'POMODORO', work: 'WORK', shortBreak: 'SHORT BREAK', longBreak: 'LONG BREAK' }[pstate.mode];
  const modeColor = pstate.mode === 'work' ? '#E8A838' : pstate.mode === 'idle' ? T.muted : 'rgba(232,232,232,0.6)';
  const completedInCycle = pstate.sessionsCompleted % sessionsBeforeLong;

  async function start() {
    const next: PomodoroState = { mode: 'work', endTime: Date.now() + workDur * 60000, running: true, sessionsCompleted: pstate.sessionsCompleted };
    await setPomodoroState(next);
    chrome.alarms.create('cinova-pomodoro', { when: next.endTime });
    prevModeRef.current = 'work';
    setPstate(next);
  }

  async function pause() {
    chrome.alarms.clear('cinova-pomodoro');
    const next: PomodoroState = { ...pstate, running: false, pausedAt: Date.now() };
    await setPomodoroState(next);
    setPstate(next);
  }

  async function resume() {
    const pausedRemaining = pstate.endTime - (pstate.pausedAt ?? pstate.endTime);
    const next: PomodoroState = { ...pstate, running: true, endTime: Date.now() + pausedRemaining, pausedAt: undefined };
    await setPomodoroState(next);
    chrome.alarms.create('cinova-pomodoro', { when: next.endTime });
    setPstate(next);
  }

  async function reset() {
    chrome.alarms.clear('cinova-pomodoro');
    const next: PomodoroState = { mode: 'idle', endTime: 0, running: false, sessionsCompleted: 0 };
    await setPomodoroState(next);
    prevModeRef.current = 'idle';
    setPstate(next);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
      <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.18em', color: modeColor, fontFamily: FONT_MONO, fontWeight: 700 }}>
        {modeLabel}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: '32px', fontWeight: 400, letterSpacing: '-0.02em', color: pstate.mode === 'idle' ? T.muted : T.text, lineHeight: 1 }}>
        {timeStr}
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
        {Array.from({ length: sessionsBeforeLong }, (_, i) => (
          <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i < completedInCycle ? '#E8A838' : 'rgba(232,232,232,0.15)', transition: 'background 300ms' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        {pstate.mode === 'idle' && (
          <button onClick={start}
            style={{ padding: '7px 18px', background: 'rgba(232,232,232,0.08)', border: `1px solid ${T.border2}`, borderRadius: '4px', color: T.text, fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT_SANS, letterSpacing: '0.06em', transition: 'background 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,232,232,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(232,232,232,0.08)')}>
            ▶ Start
          </button>
        )}
        {pstate.mode !== 'idle' && pstate.running && (
          <button onClick={pause}
            style={{ padding: '7px 18px', background: 'rgba(232,232,232,0.08)', border: `1px solid ${T.border2}`, borderRadius: '4px', color: T.text, fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT_SANS, letterSpacing: '0.06em', transition: 'background 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,232,232,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(232,232,232,0.08)')}>
            ⏸ Pause
          </button>
        )}
        {pstate.mode !== 'idle' && !pstate.running && (
          <button onClick={resume}
            style={{ padding: '7px 18px', background: 'rgba(232,232,232,0.08)', border: `1px solid ${T.border2}`, borderRadius: '4px', color: T.text, fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT_SANS, letterSpacing: '0.06em', transition: 'background 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,232,232,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(232,232,232,0.08)')}>
            ▶ Resume
          </button>
        )}
        {pstate.mode !== 'idle' && (
          <button onClick={reset}
            style={{ padding: '7px 14px', background: 'none', border: `1px solid rgba(232,232,232,0.08)`, borderRadius: '4px', color: T.muted, fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT_SANS, letterSpacing: '0.06em', transition: 'all 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(232,232,232,0.08)'; e.currentTarget.style.color = T.muted; }}>
            ↺ Reset
          </button>
        )}
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

function urlLabel(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

function SidebarSection({ label, goals, onToggle }: { label: string; goals: Goal[]; onToggle: (id: string) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visible = goals.filter(g => g.text.trim());
  if (visible.length === 0) return null;
  return (
    <div style={{ marginBottom: '26px' }}>
      <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700, color: T.muted, marginBottom: '12px' }}>{label}</div>
      {visible.map(g => {
        const urls = g.description ? extractUrls(g.description) : [];
        const descText = g.description ? g.description.replace(/https?:\/\/[^\s]+/g, '').trim() : '';
        const hasDescText = descText.length > 0 && !g.completed;
        const hasLinks = urls.length > 0 && !g.completed;
        const isExpanded = expandedId === g.id;
        return (
          <div key={g.id} onClick={() => onToggle(g.id)}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '5px 8px', margin: '0 -8px', cursor: 'pointer', borderRadius: '4px', transition: 'background 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Checkbox checked={g.completed} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '12.5px', lineHeight: 1.42, opacity: g.completed ? 0.3 : 1, textDecoration: g.completed ? 'line-through' : 'none', transition: 'opacity 0.15s' }}>
                {g.text}
              </span>
              {hasDescText && (
                <div
                  onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : g.id); }}
                  style={{
                    fontSize: '11.5px',
                    color: 'rgba(232,232,232,0.36)',
                    lineHeight: 1.45,
                    marginTop: '3px',
                    cursor: 'pointer',
                    ...(!isExpanded
                      ? { overflow: 'hidden', whiteSpace: 'nowrap' as const, textOverflow: 'ellipsis' }
                      : { whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const }),
                  }}>
                  {descText}
                </div>
              )}
              {hasLinks && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 8px', marginTop: '3px' }}>
                  {urls.map(url => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: '11px', color: '#E8A838', opacity: 0.75, textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.75')}>
                      ↗ {urlLabel(url)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
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
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    Number(localStorage.getItem('cinova-sidebar-width')) || 256
  );
  const sidebarWidthRef = React.useRef(sidebarWidth);
  sidebarWidthRef.current = sidebarWidth;

  function onDragStart(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidthRef.current;
    function onMove(ev: MouseEvent) {
      const next = Math.max(180, Math.min(480, startW + ev.clientX - startX));
      setSidebarWidth(next);
      sidebarWidthRef.current = next;
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      localStorage.setItem('cinova-sidebar-width', String(sidebarWidthRef.current));
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', color: T.text, fontFamily: FONT_SANS, animation: 'fadeIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
      <Background url={store.backgroundImage} />

      {/* Header strip */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', padding: '18px 36px 14px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <img src={logoFull} alt="Cinova" style={{ height: '26px', display: 'block', opacity: 0.92 }} />
      </div>

      {/* Content row */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', minHeight: 0 }}>

        {/* Sidebar */}
        <div style={{ position: 'relative', width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px`, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${T.border}`, background: T.surface }}>
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
          {/* Drag handle */}
          <div onMouseDown={onDragStart}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 2, background: 'transparent', transition: 'background 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,232,232,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')} />
          <div style={{ flex: 1, padding: '20px 20px', overflowY: 'auto', minHeight: 0 }}>
            <SidebarSection label="This Week" goals={store.weekly} onToggle={id => onToggleGoal('weekly', id)} />
            <SidebarSection label="This Month" goals={store.monthly} onToggle={id => onToggleGoal('monthly', id)} />
            <SidebarSection label="This Year" goals={store.yearly} onToggle={id => onToggleGoal('yearly', id)} />
          </div>
          {/* Earned rewards */}
          {(() => {
            const weeklyGoals = store.weekly.filter(g => g.text.trim());
            const total = weeklyGoals.length;
            const pct = total > 0 ? (weeklyGoals.filter(g => g.completed).length / total) * 100 : 0;
            const earned = (store.rewards ?? []).filter((r: Reward) => r.threshold <= pct);
            if (earned.length === 0) return null;
            return (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 20px' }}>
                {earned.map((r: Reward) => (
                  <div key={r.id} style={{ fontSize: '11px', color: '#E8A838', marginBottom: '4px', opacity: 0.9 }}>
                    🎁 {r.text}
                  </div>
                ))}
              </div>
            );
          })()}
          {/* Sidebar footer — settings */}
          <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 12px', display: 'flex', alignItems: 'center' }}>
            <button onClick={() => { window.location.href = chrome.runtime.getURL('src/settings/index.html'); }}
              title="Settings"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(232,232,232,0.55)', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 150ms', padding: '4px 6px', fontSize: '11px', letterSpacing: '0.06em', fontFamily: FONT_SANS }}
              onMouseEnter={e => (e.currentTarget.style.color = T.text)}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,232,232,0.55)')}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Settings
            </button>
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
            <PomodoroTimer settings={store.pomodoroSettings} />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function NewTab() {
  const [store, setLocalStore] = useState<GoalStore | null>(null);
  useEffect(() => {
    getStore().then(s => {
      const updated = maybeRotateBackground(s);
      setLocalStore(updated);
      if (updated !== s) setStore(updated);
    });
  }, []);

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
