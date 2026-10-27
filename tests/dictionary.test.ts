import { describe, it, expect } from 'vitest';
import { lookupWord } from '../src/services/dictionary';

describe('Learner Dictionary Service', () => {
  it('looks up known beginner vocabulary with definition and phonetics', () => {
    const cat = lookupWord('cat');
    expect(cat.word).toBe('cat');
    expect(cat.phonetic).toBe('/kæt/');
    expect(cat.partOfSpeech).toBe('noun');
    expect(cat.definition).toContain('carnivorous mammal');

    const run = lookupWord('run');
    expect(run.word).toBe('run');
    expect(run.partOfSpeech).toBe('verb');
  });

  it('handles morphological derivatives like plurals and gerunds', () => {
    const cats = lookupWord('cats');
    expect(cats.definition).toContain('carnivorous mammal');

    const running = lookupWord('running');
    expect(running.definition).toContain('continuous action');
  });

  it('provides meaningful fallback for unlisted vocabulary', () => {
    const unfamiliar = lookupWord('kaleidoscope');
    expect(unfamiliar.word).toBe('kaleidoscope');
    expect(unfamiliar.definition).toBeDefined();
    expect(unfamiliar.partOfSpeech).toBe('vocabulary word');
  });
});
