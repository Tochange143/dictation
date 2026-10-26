import { LessonProgress, UserSettings } from '../types';

const PROGRESS_KEY = 'dictation_progress_v1';
const SETTINGS_KEY = 'dictation_settings_v1';
const LAST_STATE_KEY = 'dictation_last_state_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  speechSpeed: 0.8,
  speechPitch: 1.0,
  selectedVoiceURI: null,
  repeatCount: 1,
  wordsPerChunk: 3, // Default 3 words at once!
  chunkThreshold: 15,
  dictationPauseMs: 2500,
  autoAdvanceOnCorrect: true,
  autoAdvanceDelayMs: 1000,
  soundEffects: true
};

export interface LastActiveState {
  lessonId: number;
  sentenceIndex: number;
}

// Local Storage Handlers
export function loadAllProgress(): Record<number, LessonProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load progress from localStorage', err);
    return {};
  }
}

export function saveLessonProgress(progress: LessonProgress): void {
  try {
    const all = loadAllProgress();
    all[progress.lessonId] = progress;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));

    // Asynchronously sync with backend server
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress)
    }).catch(err => {
      // Offline fallback: already saved in localStorage
    });
  } catch (err) {
    console.error('Failed to save progress', err);
  }
}

export function loadLessonProgress(lessonId: number): LessonProgress | null {
  const all = loadAllProgress();
  return all[lessonId] || null;
}

export function resetAllProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(LAST_STATE_KEY);

    // Sync with backend server
    fetch('/api/reset', { method: 'POST' }).catch(() => {});
  } catch (err) {
    console.error('Failed to reset progress', err);
  }
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    // Sync with backend server
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }).catch(() => {});
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function loadLastActive(): LastActiveState | null {
  try {
    const raw = localStorage.getItem(LAST_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function saveLastActive(state: LastActiveState): void {
  try {
    localStorage.setItem(LAST_STATE_KEY, JSON.stringify(state));

    // Sync with backend server
    fetch('/api/last-active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }).catch(() => {});
  } catch (err) {
    console.error('Failed to save last active state', err);
  }
}

// Fetch all initial data from server on startup
export async function syncFromServer(): Promise<{
  progress: Record<number, LessonProgress> | null;
  settings: UserSettings | null;
  lastActive: LastActiveState | null;
}> {
  try {
    const [progRes, setRes, actRes] = await Promise.all([
      fetch('/api/progress').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/settings').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/last-active').then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    if (progRes && Object.keys(progRes).length > 0) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progRes));
    }
    if (setRes) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(setRes));
    }
    if (actRes) {
      localStorage.setItem(LAST_STATE_KEY, JSON.stringify(actRes));
    }

    return {
      progress: progRes,
      settings: setRes,
      lastActive: actRes
    };
  } catch {
    return { progress: null, settings: null, lastActive: null };
  }
}
