export type TimerState = 'IDLE' | 'FOCUSING' | 'BREAKING' | 'BSOD';

export interface Settings {
  focusDuration: number; // in minutes
  breakDuration: number; // in minutes
  passwordHash?: string; // PBKDF2 hash
  salt?: string; // Password salt
  blueScreenCycles: number;
}

export const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  breakDuration: 5,
  blueScreenCycles: 3,
};

export interface TimerData {
  state: TimerState;
  endTime: number; // Timestamp
}

export const STORAGE_KEYS = {
  TIMER_DATA: 'timerData',
  SETTINGS: 'settings',
  CYCLE_COUNT: 'cycleCount'
}
