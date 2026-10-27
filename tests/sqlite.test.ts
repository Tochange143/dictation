import { describe, it, expect, beforeAll } from 'vitest';
import { 
  db, 
  lessonsDao, 
  progressDao, 
  lastActiveDao, 
  settingsDao 
} from '../server/db.js';

describe('SQLite Database Service', () => {
  beforeAll(() => {
    // Database is automatically initialized on import
    expect(db).toBeDefined();
  });

  it('retrieves all 100 lessons with valid schema', () => {
    const lessons = lessonsDao.getAll();
    expect(lessons.length).toBe(100);
    expect(lessons[0].id).toBe(1);
    expect(lessons[0].title).toBe('Sam and His Cat');
    expect(lessons[0].level).toBe(1);
    expect(lessons[0].levelName).toBe('Beginner');
  });

  it('fetches single lesson with full parsed sentences', () => {
    const l1 = lessonsDao.getById(1);
    expect(l1).not.toBeNull();
    expect(l1?.id).toBe(1);
    expect(Array.isArray(l1?.sentences)).toBe(true);
    expect(l1!.sentences.length).toBeGreaterThan(50);
    expect(l1!.sentences[0].text).toBe('I am Sam.');
  });

  it('saves and retrieves per-lesson typed story text in SQLite', () => {
    const storyText = 'I am Sam. The cat is fat. The fat cat sat on a mat.';
    progressDao.saveStory(1, storyText, 5);

    const progress = progressDao.getById(1);
    expect(progress).not.toBeNull();
    expect(progress?.typedText).toBe(storyText);
    expect(progress?.activeChunkIndex).toBe(5);
  });

  it('saves and retrieves user settings in SQLite', () => {
    settingsDao.save({
      speechSpeed: 0.9,
      voiceAccent: 'en-IN',
      evaluationMode: 'relaxed',
      wordsPerChunk: 3
    });

    const settings = settingsDao.get();
    expect(settings.speechSpeed).toBe(0.9);
    expect(settings.voiceAccent).toBe('en-IN');
    expect(settings.evaluationMode).toBe('relaxed');
    expect(settings.wordsPerChunk).toBe(3);
  });

  it('saves and retrieves last active position in SQLite', () => {
    lastActiveDao.save({
      lessonId: 12,
      sentenceIndex: 4,
      activeChunkIndex: 8,
      typedText: 'Practicing lesson twelve.'
    });

    const active = lastActiveDao.get();
    expect(active.lessonId).toBe(12);
    expect(active.sentenceIndex).toBe(4);
    expect(active.activeChunkIndex).toBe(8);
    expect(active.typedText).toBe('Practicing lesson twelve.');
  });

  it('resets progress cleanly in SQLite', () => {
    progressDao.resetAll();
    const active = lastActiveDao.get();
    expect(active.lessonId).toBe(1);
    expect(active.typedText).toBe('');
  });
});
