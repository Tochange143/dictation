import manifestData from './lessonsManifest.json';
import { Lesson } from '../types';

export interface LessonSummary {
  id: number;
  title: string;
  level: 1 | 2 | 3;
  levelName: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  wordCount: number;
  sentenceCount: number;
  fileName: string;
}

export const LESSON_MANIFEST: LessonSummary[] = manifestData as LessonSummary[];

// In-memory cache for lessons fetched from backend server
const lessonCache = new Map<number, Lesson>();

export async function fetchLessonById(id: number): Promise<Lesson> {
  if (lessonCache.has(id)) {
    return lessonCache.get(id)!;
  }

  let lesson: Lesson | null = null;

  if (typeof window !== 'undefined' && window.electronAPI) {
    lesson = await window.electronAPI.getLesson(id);
  } else {
    const res = await fetch(`/api/lessons/${id}`, {
      signal: AbortSignal.timeout(3000)
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch lesson ${id} from backend server (status ${res.status})`);
    }

    lesson = await res.json();
  }

  if (!lesson) {
    throw new Error(`Failed to fetch lesson ${id}: lesson not found`);
  }

  lessonCache.set(id, lesson);
  return lesson;
}

export function getLessonSummary(id: number): LessonSummary | undefined {
  return LESSON_MANIFEST.find(l => l.id === id);
}
