import { describe, it, expect, vi } from 'vitest';
import {
  lessonsDao,
  progressDao,
  lastActiveDao,
  settingsDao
} from '../server/db.js';

describe('Electron IPC Handler Database Layer', () => {
  it('retrieves all 100 lessons directly via database layer without HTTP server', () => {
    const lessons = lessonsDao.getAll();
    expect(lessons).toBeDefined();
    expect(lessons.length).toBe(100);
    expect(lessons[0].id).toBe(1);
    expect(lessons[0].title).toBe('Sam and His Cat');
  });

  it('retrieves a single lesson with parsed sentences', () => {
    const lesson = lessonsDao.getById(1);
    expect(lesson).toBeDefined();
    expect(lesson?.id).toBe(1);
    expect(lesson?.sentences.length).toBeGreaterThan(0);
    expect(lesson?.sentences[0].text).toBe('I am Sam.');
  });

  it('saves and reads progress directly via IPC database layer', () => {
    const sampleProgress = {
      lessonId: 1,
      currentSentenceIndex: 2,
      activeChunkIndex: 1,
      typedText: 'I am Sam.',
      completed: false,
      completedAt: null,
      bestAccuracy: 95.5,
      totalAttempts: 2,
      totalCorrectWords: 10,
      totalIncorrectWords: 1,
      timeSpentSeconds: 45,
      misspelledWordCounts: { 'sam': 1 }
    };

    progressDao.save(sampleProgress);
    const retrieved = progressDao.getById(1);
    expect(retrieved).toBeDefined();
    expect(retrieved?.lessonId).toBe(1);
    expect(retrieved?.currentSentenceIndex).toBe(2);
    expect(retrieved?.bestAccuracy).toBe(95.5);
    expect(retrieved?.misspelledWordCounts['sam']).toBe(1);
  });

  it('saves and fetches typed story text and active chunk', () => {
    const story = 'I am Sam. The cat is fat.';
    progressDao.saveStory(1, story, 2);
    lastActiveDao.save({
      lessonId: 1,
      sentenceIndex: 0,
      activeChunkIndex: 2,
      typedText: story
    });

    const retrievedProgress = progressDao.getById(1);
    expect(retrievedProgress?.typedText).toBe(story);
    expect(retrievedProgress?.activeChunkIndex).toBe(2);

    const lastActive = lastActiveDao.get();
    expect(lastActive.lessonId).toBe(1);
    expect(lastActive.activeChunkIndex).toBe(2);
    expect(lastActive.typedText).toBe(story);
  });

  it('saves and reads user settings without network overhead', () => {
    const newSettings = {
      speechSpeed: 0.85,
      speechPitch: 1.0,
      selectedVoiceURI: null,
      voiceAccent: 'en-IN' as const,
      evaluationMode: 'relaxed' as const,
      wordsPerChunk: 3,
      chunkThreshold: 15,
      dictationPauseMs: 2500,
      autoAdvanceOnCorrect: true,
      autoAdvanceDelayMs: 1000,
      soundEffects: true
    };

    settingsDao.save(newSettings);
    const loaded = settingsDao.get();
    expect(loaded.speechSpeed).toBe(0.85);
    expect(loaded.voiceAccent).toBe('en-IN');
    expect(loaded.wordsPerChunk).toBe(3);
  });

  it('resets progress cleanly across progress and last_active', () => {
    progressDao.resetAll();
    const active = lastActiveDao.get();
    expect(active.lessonId).toBe(1);
    expect(active.sentenceIndex).toBe(0);
    expect(active.typedText).toBe('');
  });
});
