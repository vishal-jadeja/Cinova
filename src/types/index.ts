export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  description?: string;
}

export interface PomodoroSettings {
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLong: number;
}

export interface PomodoroState {
  mode: 'idle' | 'work' | 'shortBreak' | 'longBreak';
  endTime: number;
  running: boolean;
  sessionsCompleted: number;
  pausedAt?: number;
}

export interface Reward {
  id: string;
  text: string;
  threshold: number;
}

export interface WeekRecord {
  weekKey: string;
  completed: number;
  total: number;
}

export interface GoalStore {
  weekly: Goal[];
  monthly: Goal[];
  yearly: Goal[];
  lastWeeklyReset: string;
  acknowledgedToday: boolean;
  lastAcknowledgedDate: string;
  onboardingComplete: boolean;
  backgroundImage?: string;
  autoBackground?: boolean;
  backgroundIndex?: number;
  lastBackgroundChange?: string;
  pomodoroSettings?: PomodoroSettings;
  focusMode?: boolean;
  focusSites?: string[];
  rewards?: Reward[];
  weekHistory?: WeekRecord[];
}
