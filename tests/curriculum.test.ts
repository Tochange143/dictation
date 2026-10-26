import { describe, it, expect } from 'vitest';
import manifest from '../src/data/lessonsManifest.json';
import fs from 'fs';
import path from 'path';

describe('100-Lesson Curriculum Integrity', () => {
  it('contains exactly 100 lessons in the manifest', () => {
    expect(manifest.length).toBe(100);
  });

  it('divides lessons into 3 distinct difficulty levels', () => {
    const level1 = manifest.filter(m => m.level === 1);
    const level2 = manifest.filter(m => m.level === 2);
    const level3 = manifest.filter(m => m.level === 3);

    expect(level1.length).toBe(35);
    expect(level2.length).toBe(35);
    expect(level3.length).toBe(30);

    expect(level1.every(m => m.id >= 1 && m.id <= 35)).toBe(true);
    expect(level2.every(m => m.id >= 36 && m.id <= 70)).toBe(true);
    expect(level3.every(m => m.id >= 71 && m.id <= 100)).toBe(true);
  });

  it('ensures every single lesson is between 950 and 1,050 words', () => {
    for (const m of manifest) {
      expect(m.wordCount).toBeGreaterThanOrEqual(950);
      expect(m.wordCount).toBeLessThanOrEqual(1050);
    }
  });

  it('verifies Lesson 1 starts with simple two-letter and three-letter words', () => {
    const lesson1Path = path.resolve(__dirname, '../server/data/lessons/lesson-001.json');
    const lesson1 = JSON.parse(fs.readFileSync(lesson1Path, 'utf-8'));

    const firstFewSentences = lesson1.sentences.slice(0, 10).map((s: any) => s.text).join(' ');
    expect(firstFewSentences).toContain('Sam');
    expect(firstFewSentences).toContain('cat');
    expect(firstFewSentences).toContain('mat');
    expect(firstFewSentences).toContain('red');
    expect(firstFewSentences).toContain('is');
  });

  it('verifies all lesson files exist on disk with valid JSON schema in backend server', () => {
    for (let i = 1; i <= 100; i++) {
      const padId = String(i).padStart(3, '0');
      const fpath = path.resolve(__dirname, `../server/data/lessons/lesson-${padId}.json`);
      expect(fs.existsSync(fpath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(fpath, 'utf-8'));
      expect(content.id).toBe(i);
      expect(content.title).toBeTruthy();
      expect(content.level).toBeGreaterThanOrEqual(1);
      expect(content.level).toBeLessThanOrEqual(3);
      expect(content.sentences.length).toBeGreaterThan(0);

      // Verify each sentence has chunks
      for (const s of content.sentences) {
        expect(s.id).toBeTruthy();
        expect(s.text).toBeTruthy();
        expect(Array.isArray(s.chunks)).toBe(true);
        expect(s.chunks.length).toBeGreaterThan(0);
      }
    }
  });
});
