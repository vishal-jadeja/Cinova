export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  description?: string;
}

export interface GoalStore {
  weekly: Goal[];
  monthly: Goal[];
  yearly: Goal[];
  lastWeeklyReset: string;
  acknowledgedToday: boolean;
  lastAcknowledgedDate: string;
  onboardingComplete: boolean;
}
