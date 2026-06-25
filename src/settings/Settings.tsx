import React, { useEffect, useState } from 'react';
import { GoalStore } from '../types';
import { getStore, setStore } from '../utils/storage';
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

export default function Settings() {
  const [store, setLocalStore] = useState<GoalStore | null>(null);
  const [customBg, setCustomBg] = useState('');
  const [autoBackground, setAutoBackground] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);

  useEffect(() => {
    getStore().then(s => {
      setLocalStore(s);
      setCustomBg(s.backgroundImage ?? '');
      setAutoBackground(s.autoBackground ?? false);
    });
  }, []);

  async function handleSave() {
    if (!store) return;
    const wasAutoOff = !store.autoBackground;
    const newStore: GoalStore = {
      ...store,
      ...(customBg.trim() ? { backgroundImage: customBg.trim() } : { backgroundImage: undefined }),
      autoBackground,
      ...(autoBackground && wasAutoOff ? { backgroundIndex: undefined, lastBackgroundChange: undefined } : {}),
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

  return (
    <div style={{ minHeight: '100vh', position: 'relative', color: T.text, fontFamily: FONT_SANS, overflowY: 'auto' }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: '-40px', backgroundImage: `url('${customBg.trim() || BG_URL}')`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(34px)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.76)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', padding: '52px 40px 80px', background: 'rgba(10,10,10,0.4)', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <img src={logoMark} alt="Cinova" style={{ height: '24px', display: 'block', opacity: 0.9 }} />
          <button onClick={() => { window.location.href = chrome.runtime.getURL('src/newtab/index.html'); }}
            style={{ background: 'none', border: `1px solid ${T.border2}`, padding: '8px 16px', fontSize: '11px', color: T.muted, letterSpacing: '0.06em', borderRadius: '4px', fontWeight: 500, cursor: 'pointer', fontFamily: FONT_SANS, transition: 'border-color 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,232,232,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border2)}>
            ← Back
          </button>
        </div>

        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '32px', color: '#ffffff' }}>Settings</h1>

        {/* Background image */}
        <div style={{ padding: '22px 24px', border: `1px solid ${T.border}`, borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', background: T.surface }}>
          <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em' }}>Background image</div>
          <div style={{ fontSize: '13px', color: T.muted, lineHeight: 1.55 }}>Paste any image URL. The blur is applied automatically.</div>
          <input
            type="text"
            value={customBg}
            onChange={e => setCustomBg(e.target.value)}
            placeholder={BG_URL}
            style={{ marginTop: '4px', width: '100%', background: 'none', border: `1px solid ${T.border2}`, borderRadius: '4px', padding: '10px 14px', fontSize: '13px', color: T.text, fontFamily: FONT_SANS, outline: 'none', letterSpacing: '0.01em', transition: 'border-color 150ms', boxSizing: 'border-box' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(232,232,232,0.3)')}
            onBlur={e => (e.currentTarget.style.borderColor = T.border2)}
          />
          {customBg.trim() && (
            <button onClick={() => setCustomBg('')}
              style={{ marginTop: '2px', padding: '9px 18px', background: 'none', border: `1px solid ${T.border2}`, fontSize: '11px', fontWeight: 600, color: T.text, letterSpacing: '0.06em', borderRadius: '4px', alignSelf: 'flex-start', cursor: 'pointer', fontFamily: FONT_SANS, transition: 'border-color 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,232,232,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = T.border2)}>
              Reset to default
            </button>
          )}
        </div>

        {/* Auto-change weekly */}
        <div style={{ padding: '22px 24px', border: `1px solid ${T.border}`, borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', background: T.surface }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em', marginBottom: '4px' }}>Auto-change background weekly</div>
              <div style={{ fontSize: '13px', color: T.muted, lineHeight: 1.55 }}>
                Cycles through curated landscapes each week when you open a new tab.
                {autoBackground && customBg.trim() && (
                  <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: T.amber, opacity: 0.8 }}>
                    Auto-rotate will override your custom URL.
                  </span>
                )}
              </div>
            </div>
            {/* Toggle pill */}
            <div onClick={() => setAutoBackground(v => !v)}
              style={{ flexShrink: 0, width: '44px', height: '24px', borderRadius: '12px', background: autoBackground ? T.amber : 'rgba(232,232,232,0.14)', cursor: 'pointer', position: 'relative', transition: 'background 200ms' }}>
              <div style={{ position: 'absolute', top: '3px', left: autoBackground ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: autoBackground ? T.accentText : T.text, transition: 'left 200ms', opacity: autoBackground ? 1 : 0.7 }} />
            </div>
          </div>
          {/* Thumbnail preview strip */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginTop: '4px', msOverflowStyle: 'none', scrollbarWidth: 'none' } as React.CSSProperties}>
            {BG_URLS.map((url, i) => (
              <div key={i} style={{
                flexShrink: 0, width: '96px', height: '64px', borderRadius: '4px',
                backgroundImage: `url('${url}')`, backgroundSize: 'cover', backgroundPosition: 'center',
                outline: autoBackground && store.backgroundIndex === i ? `2px solid ${T.amber}` : `1px solid ${T.border}`,
                outlineOffset: autoBackground && store.backgroundIndex === i ? '2px' : '0px',
                transition: 'outline 200ms, outline-offset 200ms',
              }} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: T.border, marginBottom: '28px', marginTop: '8px' }} />

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <button onClick={handleSave}
            style={{ padding: '12px 28px', background: T.accent, color: T.accentText, border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', fontFamily: FONT_SANS }}>
            Save changes
          </button>
          <span style={{ fontSize: '12px', color: T.muted, opacity: savedVisible ? 1 : 0, transition: 'opacity 0.4s', letterSpacing: '0.06em' }}>
            ✓ Saved
          </span>
        </div>

        {/* Reset weekly */}
        <div style={{ padding: '22px 24px', border: `1px solid ${T.border}`, borderRadius: '6px', display: 'inline-flex', flexDirection: 'column', gap: '8px', minWidth: '320px', background: T.surface }}>
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
    </div>
  );
}
