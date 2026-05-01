import type { WorkoutRecord, UserSettings, CalibrationData } from "../types";

const KEYS = {
  history: "workout_history",
  settings: "user_settings",
  calibration: "calibration",
  onboardingComplete: "onboarding_complete",
};

export function loadHistory(): WorkoutRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.history);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecord(record: WorkoutRecord): void {
  const history = loadHistory();
  history.unshift(record);
  localStorage.setItem(KEYS.history, JSON.stringify(history));
}

export function getStreak(): number {
  const history = loadHistory();
  if (history.length === 0) return 0;

  const dates = history.map((r) => r.date.slice(0, 10));
  const unique = [...new Set(dates)].sort().reverse();

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < unique.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (unique[i] === expected.toISOString().slice(0, 10)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// --- Settings ---

const defaultSettings: UserSettings = {
  reminderInterval: 45,
  reminderEnabled: true,
  voiceEnabled: true,
  selectedCamera: "",
  deepseekApiKey: "",
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: UserSettings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
}

// --- Calibration ---

export function loadCalibration(): CalibrationData | null {
  try {
    const raw = localStorage.getItem(KEYS.calibration);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCalibration(data: CalibrationData): void {
  localStorage.setItem(KEYS.calibration, JSON.stringify(data));
}

// --- Onboarding ---

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(KEYS.onboardingComplete) === "true";
}

export function setOnboardingComplete(): void {
  localStorage.setItem(KEYS.onboardingComplete, "true");
}
