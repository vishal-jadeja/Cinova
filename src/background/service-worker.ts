import { GoalStore, PomodoroState, PomodoroSettings, WeekRecord } from '../types';
import { getISOWeekKey } from '../utils/storage';

const DEFAULT_POMODORO: PomodoroSettings = {
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLong: 4,
};

async function syncFocusRules() {
  const data = await chrome.storage.sync.get('cinova');
  const store: GoalStore = data.cinova;
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRules.map((r) => r.id),
    addRules:
      !store?.focusMode || !store.focusSites?.length
        ? []
        : store.focusSites.map((domain, i) => ({
            id: i + 1,
            priority: 1,
            action: {
              type: 'redirect' as const,
              redirect: { extensionPath: `/src/blockpage/index.html?site=${encodeURIComponent(domain)}` },
            },
            condition: {
              urlFilter: `||${domain}`,
              resourceTypes: ['main_frame' as const],
            },
          })),
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('dailyCheck', { periodInMinutes: 60 });
  syncFocusRules();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes['cinova']) {
    syncFocusRules();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cinova-pomodoro') {
    const localData = await chrome.storage.local.get('cinova-pomodoro');
    const state: PomodoroState = localData['cinova-pomodoro'];
    if (!state?.running) return;

    const syncData = await chrome.storage.sync.get('cinova');
    const settings: PomodoroSettings = syncData.cinova?.pomodoroSettings ?? DEFAULT_POMODORO;

    let nextSessions = state.sessionsCompleted;
    let nextMode: PomodoroState['mode'];
    if (state.mode === 'work') {
      nextSessions++;
      nextMode =
        nextSessions % settings.sessionsBeforeLong === 0 ? 'longBreak' : 'shortBreak';
    } else {
      nextMode = 'work';
    }

    const dur =
      nextMode === 'work'
        ? settings.workDuration
        : nextMode === 'shortBreak'
        ? settings.shortBreak
        : settings.longBreak;

    const nextState: PomodoroState = {
      mode: nextMode,
      endTime: Date.now() + dur * 60000,
      running: true,
      sessionsCompleted: nextSessions,
    };

    await chrome.storage.local.set({ 'cinova-pomodoro': nextState });
    chrome.alarms.create('cinova-pomodoro', { when: nextState.endTime });

    const label =
      nextMode === 'work'
        ? 'Time to focus!'
        : nextMode === 'shortBreak'
        ? 'Short break — 5 minutes'
        : 'Long break — well earned!';
    chrome.notifications.create('cinova-pomodoro', {
      type: 'basic',
      iconUrl: 'CinovaLogo.png',
      title: 'Cinova',
      message: label,
    });
    return;
  }

  if (alarm.name !== 'dailyCheck') return;

  const data = await chrome.storage.sync.get('cinova');
  const store: GoalStore = data.cinova;
  if (!store) return;

  const today = new Date();
  const lastReset = new Date(store.lastWeeklyReset);
  const isMonday = today.getDay() === 1;
  const isNewWeek = today.getTime() - lastReset.getTime() > 6 * 24 * 60 * 60 * 1000;

  if (isMonday && isNewWeek) {
    // save history before reset
    const completed = store.weekly.filter((g) => g.completed && g.text.trim()).length;
    const total = store.weekly.filter((g) => g.text.trim()).length;
    if (total > 0) {
      const record: WeekRecord = { weekKey: getISOWeekKey(today), completed, total };
      store.weekHistory = [...(store.weekHistory ?? []).slice(-51), record];
    }
    store.weekly = store.weekly.map((g) => ({ ...g, completed: false }));
    store.lastWeeklyReset = today.toISOString();
    await chrome.storage.sync.set({ cinova: store });
  }

  const todayStr = today.toISOString().split('T')[0];
  if (store.lastAcknowledgedDate !== todayStr) {
    store.acknowledgedToday = false;
    await chrome.storage.sync.set({ cinova: store });
  }
});
