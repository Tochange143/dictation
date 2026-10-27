import { LessonProgress, UserSettings } from '../types';

const PROGRESS_KEY = 'dictation_progress_v1';
const SETTINGS_KEY = 'dictation_settings_v1';
const LAST_STATE_KEY = 'dictation_last_state_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  speechSpeed: 0.8,
  speechPitch: 1.0,
  selectedVoiceURI: null,
  voiceAccent: 'en-IN', // Indian accent by default
  evaluationMode: 'relaxed', // Default to relaxed for learner-friendly dictation!
  announcePunctuation: false,
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
  activeChunkIndex?: number;
  typedText?: string;
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

    // Asynchronously sync with backend server with fast timeout
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
      signal: AbortSignal.timeout(800)
    }).catch(() => {
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

export function saveLessonTypedStory(lessonId: number, typedText: string, activeChunkIndex: number): void {
  try {
    localStorage.setItem(`dictation_story_${lessonId}`, JSON.stringify({ typedText, activeChunkIndex }));
    const all = loadAllProgress();
    all[lessonId] = {
      ...(all[lessonId] || {
        lessonId,
        currentSentenceIndex: 0,
        completed: false,
        totalAttempts: 1,
        totalCorrectWords: 0,
        totalIncorrectWords: 0,
        timeSpentSeconds: 0,
        misspelledWordCounts: {}
      }),
      typedText,
      activeChunkIndex
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));

    // Sync to server
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(all[lessonId]),
      signal: AbortSignal.timeout(800)
    }).catch(() => {});
  } catch {}
}

export function loadLessonTypedStory(lessonId: number): { typedText: string; activeChunkIndex: number } | null {
  try {
    const raw = localStorage.getItem(`dictation_story_${lessonId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.typedText === 'string') {
        return parsed;
      }
    }
    const all = loadAllProgress();
    if (all[lessonId] && typeof all[lessonId].typedText === 'string') {
      return {
        typedText: all[lessonId].typedText || '',
        activeChunkIndex: all[lessonId].activeChunkIndex || 0
      };
    }
  } catch {}
  return null;
}

export function resetAllProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(LAST_STATE_KEY);
    // Clear lesson stories from localStorage
    for (let i = 1; i <= 100; i++) {
      localStorage.removeItem(`dictation_story_${i}`);
    }

    // Sync with backend server
    fetch('/api/reset', { method: 'POST', signal: AbortSignal.timeout(800) }).catch(() => {});
  } catch (err) {
    console.error('Failed to reset progress', err);
  }
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      voiceAccent: parsed.voiceAccent || 'en-IN'
    };
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
      body: JSON.stringify(settings),
      signal: AbortSignal.timeout(800)
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
      body: JSON.stringify(state),
      signal: AbortSignal.timeout(800)
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
      fetch('/api/progress', { signal: AbortSignal.timeout(800) }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/settings', { signal: AbortSignal.timeout(800) }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/last-active', { signal: AbortSignal.timeout(800) }).then(r => r.ok ? r.json() : null).catch(() => null)
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
