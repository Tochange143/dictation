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

// Vite dynamic glob import for on-demand lazy loading of lessons
const lessonModules = import.meta.glob<{ default: Lesson }>('./lessons/lesson-*.json');

export async function fetchLessonById(id: number): Promise<Lesson> {
  const padId = String(id).padStart(3, '0');
  const path = `./lessons/lesson-${padId}.json`;
  const loader = lessonModules[path];
  if (!loader) {
    throw new Error(`Lesson ${id} not found at ${path}`);
  }
  const module = await loader();
  return module.default;
}

export function getLessonSummary(id: number): LessonSummary | undefined {
  return LESSON_MANIFEST.find(l => l.id === id);
}
