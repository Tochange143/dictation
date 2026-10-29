import { Lesson, LessonProgress, UserSettings } from './types';
import { LastActiveState } from './services/storage';

export interface ElectronAPI {
  isElectron: boolean;
  getLessons: () => Promise<any[]>;
  getLesson: (id: number) => Promise<Lesson | null>;
  getProgress: () => Promise<Record<number, LessonProgress>>;
  getLessonProgress: (id: number) => Promise<LessonProgress>;
  saveProgress: (progress: LessonProgress) => Promise<LessonProgress | null>;
  getStory: (lessonId: number) => Promise<{ lessonId: number; typedText: string; activeChunkIndex: number }>;
  saveStory: (lessonId: number, typedText: string, activeChunkIndex: number) => Promise<{ success: boolean; lessonId: number }>;
  getSettings: () => Promise<UserSettings>;
  saveSettings: (settings: Partial<UserSettings>) => Promise<UserSettings>;
  getLastActive: () => Promise<LastActiveState>;
  saveLastActive: (state: LastActiveState) => Promise<LastActiveState>;
  resetAll: () => Promise<{ success: boolean }>;
  getHealth: () => Promise<{ status: string; backend: string; timestamp: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
