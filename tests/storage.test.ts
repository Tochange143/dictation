import { describe, it, expect, beforeEach } from 'vitest';
import { 
  loadAllProgress, 
  saveLessonProgress, 
  loadSettings, 
  saveSettings, 
  loadLastActive, 
  saveLastActive, 
  resetAllProgress,
  DEFAULT_SETTINGS 
} from '../src/services/storage';

// In-memory mock for localStorage in Node/Vitest
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock
});

describe('LocalStorage Persistence Service', () => {
  beforeEach(() => {
    storageMock.clear();
  });

  it('saves and loads lesson progress', () => {
    const progress = {
      lessonId: 5,
      currentSentenceIndex: 12,
      completed: true,
      bestAccuracy: 98,
      totalAttempts: 2,
      totalCorrectWords: 950,
      totalIncorrectWords: 15,
      timeSpentSeconds: 340,
      misspelledWordCounts: { 'cat': 2, 'the': 1 }
    };

    saveLessonProgress(progress);
    const loaded = loadAllProgress();
    expect(loaded[5]).toEqual(progress);
  });

  it('saves and loads user settings', () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      speechSpeed: 1.2,
      repeatCount: 2 as const,
      autoAdvanceOnCorrect: true
    };

    saveSettings(customSettings);
    const loaded = loadSettings();
    expect(loaded.speechSpeed).toBe(1.2);
    expect(loaded.repeatCount).toBe(2);
    expect(loaded.autoAdvanceOnCorrect).toBe(true);
  });

  it('saves and loads last active position', () => {
    saveLastActive({ lessonId: 42, sentenceIndex: 7 });
    const loaded = loadLastActive();
    expect(loaded).toEqual({ lessonId: 42, sentenceIndex: 7 });
  });

  it('resets all progress cleanly', () => {
    saveLastActive({ lessonId: 10, sentenceIndex: 2 });
    saveLessonProgress({
      lessonId: 10,
      currentSentenceIndex: 2,
      completed: true,
      totalAttempts: 1,
      totalCorrectWords: 50,
      totalIncorrectWords: 2,
      timeSpentSeconds: 100,
      misspelledWordCounts: {}
    });

    resetAllProgress();
    expect(loadAllProgress()).toEqual({});
    expect(loadLastActive()).toBeNull();
  });
});
