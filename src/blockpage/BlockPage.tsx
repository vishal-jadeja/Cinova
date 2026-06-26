import React, { useEffect, useState } from 'react';
import { Goal, GoalStore } from '../types';
import { getStore, setStore } from '../utils/storage';

const T = {
  text: '#e8e8e8',
  muted: 'rgba(232,232,232,0.36)',
  border: 'rgba(232,232,232,0.07)',
  surface: 'rgba(18,18,18,0.72)',
  amber: '#E8A838',
};

export default function BlockPage() {
  const [store, setStoreState] = useState<GoalStore | null>(null);
  const [disabling, setDisabling] = useState(false);

  const site = new URLSearchParams(location.search).get('site') ?? 'this site';

  useEffect(() => {
    getStore().then(setStoreState);
  }, []);

  async function disableFocusMode() {
    if (!store) return;
    setDisabling(true);
    await setStore({ ...store, focusMode: false });
    history.back();
  }

  const weeklyGoals: Goal[] = (store?.weekly ?? []).filter((g) => g.text.trim() && !g.completed);
  const completedGoals: Goal[] = (store?.weekly ?? []).filter((g) => g.text.trim() && g.completed);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Space Grotesk', sans-serif",
      color: T.text,
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <img src="/CinovaLogo.png" alt="Cinova" width={48} style={{ marginBottom: '28px', opacity: 0.9 }} />

        <div style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: T.amber,
          fontWeight: 700,
          marginBottom: '12px',
        }}>
          Focus Mode
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>
          {site} is blocked
        </h1>

        <p style={{ fontSize: '14px', color: T.muted, margin: '0 0 40px', lineHeight: 1.6 }}>
          You're in focus mode. Come back when you're done with what matters.
        </p>

        {weeklyGoals.length > 0 && (
          <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: '10px',
            padding: '20px 24px',
            marginBottom: '32px',
            textAlign: 'left',
          }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, color: T.muted, marginBottom: '14px' }}>
              This week's goals
            </div>
            {weeklyGoals.map((g) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: `1.5px solid rgba(232,232,232,0.25)`,
                  flexShrink: 0, marginTop: '2px',
                }} />
                <span style={{ fontSize: '13px', lineHeight: 1.4 }}>{g.text}</span>
              </div>
            ))}
            {completedGoals.length > 0 && (
              <>
                {completedGoals.map((g) => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', opacity: 0.3 }}>
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      background: T.amber, flexShrink: 0, marginTop: '2px',
                    }} />
                    <span style={{ fontSize: '13px', lineHeight: 1.4, textDecoration: 'line-through' }}>{g.text}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <button
          onClick={disableFocusMode}
          disabled={disabling}
          style={{
            background: 'transparent',
            border: `1px solid rgba(232,232,232,0.15)`,
            borderRadius: '6px',
            color: T.muted,
            fontSize: '12px',
            padding: '8px 18px',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(232,232,232,0.3)';
            e.currentTarget.style.color = T.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(232,232,232,0.15)';
            e.currentTarget.style.color = T.muted;
          }}
        >
          {disabling ? 'Disabling…' : 'Disable Focus Mode'}
        </button>
      </div>
    </div>
  );
}
