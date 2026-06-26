import { GoalStore, PomodoroState } from '../types';

export const DEFAULT_STORE: GoalStore = {
  weekly: [],
  monthly: [],
  yearly: [],
  lastWeeklyReset: new Date().toISOString(),
  acknowledgedToday: false,
  lastAcknowledgedDate: '',
  onboardingComplete: false,
};

export const DEFAULT_POMODORO_STATE: PomodoroState = {
  mode: 'idle',
  endTime: 0,
  running: false,
  sessionsCompleted: 0,
};

export const getStore = (): Promise<GoalStore> =>
  new Promise((resolve) =>
    chrome.storage.sync.get('cinova', (data) =>
      resolve(data.cinova ?? DEFAULT_STORE)
    )
  );

export const setStore = (store: GoalStore): Promise<void> =>
  new Promise((resolve) =>
    chrome.storage.sync.set({ cinova: store }, resolve)
  );

export const getPomodoroState = (): Promise<PomodoroState> =>
  new Promise((resolve) =>
    chrome.storage.local.get('cinova-pomodoro', (d) =>
      resolve(d['cinova-pomodoro'] ?? DEFAULT_POMODORO_STATE)
    )
  );

export const setPomodoroState = (s: PomodoroState): Promise<void> =>
  new Promise((resolve) =>
    chrome.storage.local.set({ 'cinova-pomodoro': s }, resolve)
  );

export function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
}
