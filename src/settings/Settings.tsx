import React, { useEffect, useState } from 'react';
import { GoalStore } from '../types';
import { getStore, setStore, getISOWeekKey } from '../utils/storage';
import logoMark from '/CinovaLogo.png';

const FONT_SANS = "'Space Grotesk', sans-serif";
const BG_URLS = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=60',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=60',
  'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=400&q=60',
  'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=400&q=60',
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=400&q=60',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=400&q=60',
  'https://images.unsplash.com/photo-1439853949212-36089c9a8957?auto=format&fit=crop&w=400&q=60',
  'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&w=400&q=60',
];
const BG_URL = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80';

const T = {
  text: '#e8e8e8',
  muted: 'rgba(232,232,232,0.36)',
  border: 'rgba(232,232,232,0.07)',
  border2: 'rgba(232,232,232,0.14)',
  surface: 'rgba(18,18,18,0.62)',
  accent: '#e8e8e8',
  accentText: '#0d0d0d',
  amber: '#E8A838',
};

type Snapshot = {
  customBg: string;
  bgMode: 'custom' | 'auto';
  selectedBgIndex: number | null;
  pomodoroWork: number;
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
  pomodoroSessions: number;
  focusEnabled: boolean;
  focusSites: string[];
};

function NumInput({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
      <label style={{ fontSize: '11px', color: T.muted, letterSpacing: '0.05em' }}>{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${T.border2}`,
          borderRadius: '5px',
          padding: '9px 12px',
          fontSize: '13px',
          color: T.text,
          fontFamily: FONT_SANS,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box' as const,
          transition: 'border-color 150ms',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(232,232,232,0.3)')}
        onBlur={e => (e.currentTarget.style.borderColor = T.border2)}
      />
    </div>
  );
}

export default function Settings() {
  const [store, setLocalStore] = useState<GoalStore | null>(null);
  // background
  const [customBg, setCustomBg] = useState('');
  const [bgMode, setBgMode] = useState<'custom' | 'auto'>('auto');
  const [selectedBgIndex, setSelectedBgIndex] = useState<number | null>(null);
  // pomodoro
  const [pomodoroWork, setPomodoroWork] = useState(25);
  const [pomodoroShortBreak, setPomodoroShortBreak] = useState(5);
  const [pomodoroLongBreak, setPomodoroLongBreak] = useState(15);
  const [pomodoroSessions, setPomodoroSessions] = useState(4);
  // focus mode
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [focusSites, setFocusSites] = useState<string[]>([]);
  const [focusSiteInput, setFocusSiteInput] = useState('');
  // ui state
  const [isDirty, setIsDirty] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    getStore().then(s => {
      setLocalStore(s);
      setCustomBg(s.backgroundImage ?? '');
      setBgMode(s.autoBackground ? 'auto' : 'custom');
      setSelectedBgIndex(s.backgroundIndex ?? null);
      const pm = s.pomodoroSettings;
      const pw = pm?.workDuration ?? 25;
      const ps = pm?.shortBreak ?? 5;
      const pl = pm?.longBreak ?? 15;
      const pb = pm?.sessionsBeforeLong ?? 4;
      setPomodoroWork(pw);
      setPomodoroShortBreak(ps);
      setPomodoroLongBreak(pl);
      setPomodoroSessions(pb);
      setFocusEnabled(s.focusMode ?? false);
      setFocusSites(s.focusSites ?? []);
      setSnapshot({
        customBg: s.backgroundImage ?? '',
        bgMode: s.autoBackground ? 'auto' : 'custom',
        selectedBgIndex: s.backgroundIndex ?? null,
        pomodoroWork: pw,
        pomodoroShortBreak: ps,
        pomodoroLongBreak: pl,
        pomodoroSessions: pb,
        focusEnabled: s.focusMode ?? false,
        focusSites: s.focusSites ?? [],
      });
    });
  }, []);

  const navigateBack = () => { window.location.href = chrome.runtime.getURL('src/newtab/index.html'); };
  const markDirty = () => setIsDirty(true);

  async function handleSave() {
    if (!store) return;
    const wasAutoOff = !store.autoBackground;
    const isAuto = bgMode === 'auto';
    const newStore: GoalStore = {
      ...store,
      ...(bgMode === 'custom' && customBg.trim() ? { backgroundImage: customBg.trim() } : bgMode === 'custom' ? { backgroundImage: undefined } : {}),
      autoBackground: isAuto,
      ...(isAuto && selectedBgIndex !== null
        ? {
            backgroundIndex: selectedBgIndex,
            backgroundImage: BG_URLS[selectedBgIndex].replace('w=400&q=60', 'w=1920&q=80'),
            lastBackgroundChange: getISOWeekKey(new Date()),
          }
        : isAuto && wasAutoOff
          ? { backgroundIndex: undefined, lastBackgroundChange: undefined }
          : {}),
      pomodoroSettings: { workDuration: pomodoroWork, shortBreak: pomodoroShortBreak, longBreak: pomodoroLongBreak, sessionsBeforeLong: pomodoroSessions },
      focusMode: focusEnabled,
      focusSites,
    };
    await setStore(newStore);
    setLocalStore(newStore);
    setSnapshot({ customBg: customBg.trim(), bgMode, selectedBgIndex, pomodoroWork, pomodoroShortBreak, pomodoroLongBreak, pomodoroSessions, focusEnabled, focusSites });
    setIsDirty(false);
    setSavedVisible(true);
    setTimeout(() => setSavedVisible(false), 2500);
  }

  function handleDiscard() {
    if (snapshot) {
      setCustomBg(snapshot.customBg);
      setBgMode(snapshot.bgMode);
      setSelectedBgIndex(snapshot.selectedBgIndex);
      setPomodoroWork(snapshot.pomodoroWork);
      setPomodoroShortBreak(snapshot.pomodoroShortBreak);
      setPomodoroLongBreak(snapshot.pomodoroLongBreak);
      setPomodoroSessions(snapshot.pomodoroSessions);
      setFocusEnabled(snapshot.focusEnabled);
      setFocusSites(snapshot.focusSites);
    }
    setIsDirty(false);
    setShowLeaveModal(false);
  }

  async function handleResetWeekly() {
    if (!store) return;
    const newStore: GoalStore = { ...store, weekly: store.weekly.map(g => ({ ...g, completed: false })) };
    await setStore(newStore);
    setLocalStore(newStore);
  }

  function addFocusSite() {
    const raw = focusSiteInput.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!raw || focusSites.includes(raw)) return;
    setFocusSites(prev => [...prev, raw]);
    setFocusSiteInput('');
    markDirty();
  }

  if (!store) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '16px', height: '16px', border: '1.5px solid #e8e8e8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', color: T.text, fontFamily: FONT_SANS, overflowY: 'auto', background: 'rgba(10,10,10,0.18)' }}>

      {/* Leave modal */}
      {showLeaveModal && (
        <div onClick={() => setShowLeaveModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'rgba(18,18,18,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${T.border2}`, borderRadius: '12px', padding: '32px 36px', width: '440px', display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.15s ease-out' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>Unsaved changes</div>
            <div style={{ fontSize: '13px', color: T.muted, lineHeight: 1.65 }}>You have unsaved changes to your settings. What would you like to do?</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={handleDiscard}
                style={{ background: 'none', border: `1px solid ${T.border2}`, color: T.muted, padding: '10px 18px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', borderRadius: '5px', cursor: 'pointer', fontFamily: FONT_SANS, transition: 'border-color 150ms, color 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,232,232,0.3)'; e.currentTarget.style.color = T.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.muted; }}>
                Discard changes
              </button>
              <button onClick={async () => { await handleSave(); navigateBack(); }}
                style={{ background: '#e8e8e8', color: '#0d0d0d', border: 'none', padding: '10px 22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', borderRadius: '5px', cursor: 'pointer', fontFamily: FONT_SANS }}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: '-40px', backgroundImage: `url('${customBg.trim() || BG_URL}')`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(34px)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.76)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '880px', margin: '0 auto', padding: '52px 40px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <img src={logoMark} alt="Cinova" style={{ height: '24px', display: 'block', opacity: 0.9 }} />
          <button
            onClick={() => { if (isDirty) { setShowLeaveModal(true); } else { navigateBack(); } }}
            style={{ background: 'none', border: `1px solid ${T.border2}`, padding: '8px 16px', fontSize: '11px', color: T.muted, letterSpacing: '0.06em', borderRadius: '4px', fontWeight: 500, cursor: 'pointer', fontFamily: FONT_SANS, transition: 'border-color 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,232,232,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border2)}>
            ← Back
          </button>
        </div>

        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '32px', color: '#ffffff' }}>Settings</h1>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'start', marginBottom: '28px' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Background card */}
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden', background: T.surface }}>
              {/* Live preview */}
              <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', inset: '-20px',
                  backgroundImage: `url('${bgMode === 'auto' ? BG_URLS[selectedBgIndex ?? store.backgroundIndex ?? 0] : (customBg.trim() || BG_URL)}')`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: 'blur(8px)', transform: 'scale(1.06)',
                  transition: 'background-image 400ms',
                }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.52)' }} />
                <div style={{ position: 'absolute', bottom: '14px', left: '18px', fontSize: '11px', letterSpacing: '0.08em', color: 'rgba(232,232,232,0.45)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Preview
                </div>
              </div>
              {/* Card body */}
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em' }}>Background</div>
                  <div style={{ display: 'flex', background: 'rgba(232,232,232,0.06)', borderRadius: '6px', padding: '3px', gap: '2px' }}>
                    {(['auto', 'custom'] as const).map(mode => (
                      <button key={mode} onClick={() => { setBgMode(mode); markDirty(); }}
                        style={{
                          background: bgMode === mode ? 'rgba(232,232,232,0.12)' : 'none',
                          border: 'none', borderRadius: '4px',
                          padding: '6px 14px', fontSize: '11px', fontWeight: 600,
                          color: bgMode === mode ? '#ffffff' : T.muted,
                          letterSpacing: '0.04em', cursor: 'pointer',
                          fontFamily: FONT_SANS,
                          borderBottom: bgMode === mode ? `2px solid ${T.amber}` : '2px solid transparent',
                          transition: 'color 150ms, background 150ms',
                        }}>
                        {mode === 'custom' ? 'Custom' : 'Auto-rotate'}
                      </button>
                    ))}
                  </div>
                </div>
                {bgMode === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                      <input type="text" value={customBg} onChange={e => { setCustomBg(e.target.value); markDirty(); }}
                        placeholder="Paste an image URL…"
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border2}`, borderRadius: '5px', padding: '10px 38px 10px 14px', fontSize: '13px', color: T.text, fontFamily: FONT_SANS, outline: 'none', letterSpacing: '0.01em', transition: 'border-color 150ms', boxSizing: 'border-box' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(232,232,232,0.3)')}
                        onBlur={e => (e.currentTarget.style.borderColor = T.border2)} />
                      {customBg.trim() && (
                        <button onClick={() => { setCustomBg(''); markDirty(); }}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: '14px', padding: '2px 4px', lineHeight: 1, transition: 'color 150ms' }}
                          onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                          onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>✕</button>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: T.muted, lineHeight: 1.5 }}>
                      Paste any direct image URL. Blur is applied automatically.
                    </div>
                  </div>
                )}
                {bgMode === 'auto' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 2px 6px', msOverflowStyle: 'none', scrollbarWidth: 'none' } as React.CSSProperties}>
                      {BG_URLS.map((url, i) => {
                        const isActive = (selectedBgIndex ?? store.backgroundIndex) === i;
                        return (
                          <div key={i} onClick={() => { setSelectedBgIndex(i); markDirty(); }} style={{
                            flexShrink: 0, width: '120px', height: '80px', borderRadius: '5px',
                            backgroundImage: `url('${url}')`, backgroundSize: 'cover', backgroundPosition: 'center',
                            border: isActive ? `2px solid ${T.amber}` : `1px solid ${T.border}`,
                            transition: 'border 200ms, filter 150ms', cursor: 'pointer',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
                          />
                        );
                      })}
                    </div>
                    <div style={{ fontSize: '12px', color: T.muted, lineHeight: 1.5 }}>
                      Cycles through curated landscapes — a new one each week when you open a new tab.
                      {store.backgroundIndex != null && (
                        <span style={{ color: T.amber, marginLeft: '6px', opacity: 0.85 }}>Amber ring = current week.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pomodoro card */}
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '8px', background: T.surface, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em' }}>Pomodoro Timer</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <NumInput label="Work (min)" value={pomodoroWork} min={1} max={120} onChange={v => { setPomodoroWork(v); markDirty(); }} />
                <NumInput label="Short break" value={pomodoroShortBreak} min={1} max={60} onChange={v => { setPomodoroShortBreak(v); markDirty(); }} />
                <NumInput label="Long break" value={pomodoroLongBreak} min={1} max={120} onChange={v => { setPomodoroLongBreak(v); markDirty(); }} />
                <NumInput label="Sessions" value={pomodoroSessions} min={1} max={10} onChange={v => { setPomodoroSessions(v); markDirty(); }} />
              </div>
              <div style={{ fontSize: '12px', color: T.muted, lineHeight: 1.5 }}>
                After <strong style={{ color: T.text, fontWeight: 600 }}>{pomodoroSessions}</strong> work sessions, you'll get a {pomodoroLongBreak}-minute long break. Short breaks are {pomodoroShortBreak} minutes.
              </div>
            </div>

            {/* Focus Mode card */}
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '8px', background: T.surface, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em', marginBottom: '3px' }}>Focus Mode</div>
                  <div style={{ fontSize: '12px', color: T.muted }}>Block distracting sites while you focus.</div>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => { setFocusEnabled(prev => !prev); markDirty(); }}
                  style={{
                    width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                    background: focusEnabled ? T.amber : 'rgba(232,232,232,0.12)',
                    position: 'relative', flexShrink: 0,
                    transition: 'background 200ms',
                  }}>
                  <span style={{
                    position: 'absolute', top: '3px',
                    left: focusEnabled ? '21px' : '3px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: focusEnabled ? '#0d0d0d' : 'rgba(232,232,232,0.5)',
                    transition: 'left 200ms',
                  }} />
                </button>
              </div>

              {/* Add site input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={focusSiteInput}
                  onChange={e => setFocusSiteInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addFocusSite(); }}
                  placeholder="twitter.com"
                  style={{
                    flex: 1, background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border2}`,
                    borderRadius: '5px', padding: '9px 14px', fontSize: '13px', color: T.text,
                    fontFamily: FONT_SANS, outline: 'none', transition: 'border-color 150ms',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(232,232,232,0.3)')}
                  onBlur={e => (e.currentTarget.style.borderColor = T.border2)}
                />
                <button
                  onClick={addFocusSite}
                  style={{
                    background: 'rgba(232,232,232,0.08)', border: `1px solid ${T.border2}`,
                    borderRadius: '5px', padding: '9px 16px', fontSize: '12px', fontWeight: 600,
                    color: T.text, cursor: 'pointer', fontFamily: FONT_SANS, whiteSpace: 'nowrap' as const,
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,232,232,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(232,232,232,0.08)')}>
                  + Add
                </button>
              </div>

              {/* Site list */}
              {focusSites.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {focusSites.map(site => (
                    <div key={site} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '5px', border: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: '13px', color: T.text }}>{site}</span>
                      <button
                        onClick={() => { setFocusSites(prev => prev.filter(s => s !== site)); markDirty(); }}
                        style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: '14px', padding: '2px 4px', lineHeight: 1, transition: 'color 150ms' }}
                        onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                        onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {focusSites.length === 0 && (
                <div style={{ fontSize: '12px', color: T.muted, lineHeight: 1.5 }}>
                  No sites blocked yet. Add a domain above to block it when focus mode is on.
                </div>
              )}
            </div>

          </div>{/* end left column */}

          {/* Right column — actions */}
          <div style={{ position: 'sticky', top: '52px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '22px 24px', border: `1px solid ${T.border}`, borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px', background: T.surface }}>
              <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em' }}>Reset weekly progress</div>
              <div style={{ fontSize: '13px', color: T.muted, lineHeight: 1.55 }}>Unchecks all weekly goals without deleting them.</div>
              <button onClick={handleResetWeekly}
                style={{ marginTop: '4px', padding: '9px 18px', background: 'none', border: `1px solid ${T.border2}`, fontSize: '11px', fontWeight: 600, color: T.text, letterSpacing: '0.06em', borderRadius: '4px', alignSelf: 'flex-start', cursor: 'pointer', fontFamily: FONT_SANS, transition: 'border-color 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,232,232,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T.border2)}>
                Reset weekly progress
              </button>
            </div>
          </div>

        </div>{/* end grid */}

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={handleSave}
            style={{ padding: '12px 28px', background: T.accent, color: T.accentText, border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', fontFamily: FONT_SANS }}>
            Save changes
          </button>
          <span style={{ fontSize: '12px', color: T.muted, opacity: savedVisible ? 1 : 0, transition: 'opacity 0.4s', letterSpacing: '0.06em' }}>
            ✓ Saved
          </span>
        </div>

      </div>
    </div>
  );
}
