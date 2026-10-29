import { describe, it, expect } from 'vitest';
import { getPhonicHint, syllabifyWord } from '../src/utils/phonics';

describe('Phonics Sound-to-Spelling Diagnostic Engine', () => {
  it('detects /f/ sound spelled with "ph" (e.g. fone -> phone)', () => {
    const hint = getPhonicHint('fone', 'phone');
    expect(hint).not.toBeNull();
    expect(hint?.type).toBe('phonetic_match');
    expect(hint?.soundPattern).toContain('/f/');
    expect(hint?.ruleExplanation).toContain('"ph"');
  });

  it('detects long /aɪ/ sound spelled with "-ight" (e.g. nite -> night)', () => {
    const hint = getPhonicHint('nite', 'night');
    expect(hint).not.toBeNull();
    expect(hint?.type).toBe('vowel_pattern');
    expect(hint?.soundPattern).toContain('ight');
  });

  it('detects silent initial "k" before "n" (e.g. now -> know, nife -> knife)', () => {
    const hint = getPhonicHint('now', 'know');
    expect(hint).not.toBeNull();
    expect(hint?.type).toBe('silent_letter');
    expect(hint?.title).toContain('Silent "K"');
  });

  it('detects silent initial "w" before "r" (e.g. rite -> write)', () => {
    const hint = getPhonicHint('rite', 'write');
    expect(hint).not.toBeNull();
    expect(hint?.type).toBe('silent_letter');
    expect(hint?.title).toContain('Silent "W"');
  });

  it('detects silent "b" after "m" (e.g. dum -> dumb, clime -> climb)', () => {
    const hint = getPhonicHint('dum', 'dumb');
    expect(hint).not.toBeNull();
    expect(hint?.type).toBe('silent_letter');
  });

  it('detects soft "c" sounding like /s/ (e.g. sity -> city)', () => {
    const hint = getPhonicHint('sity', 'city');
    expect(hint).not.toBeNull();
    expect(hint?.type).toBe('soft_consonant');
    expect(hint?.soundPattern).toContain('/s/');
  });

  it('detects noun suffix "-tion" (e.g. akshun -> action)', () => {
    const hint = getPhonicHint('akshun', 'action');
    expect(hint).not.toBeNull();
    expect(hint?.type).toBe('suffix_pattern');
  });

  it('detects vowel team "ea" vs "ee" (e.g. cleen -> clean)', () => {
    const hint = getPhonicHint('cleen', 'clean');
    expect(hint).not.toBeNull();
    expect(hint?.type).toBe('vowel_pattern');
  });

  it('returns null when words match exactly', () => {
    const hint = getPhonicHint('phone', 'phone');
    expect(hint).toBeNull();
  });
});

describe('Syllabification Engine ("Sound It Out")', () => {
  it('correctly syllabifies multi-syllable common English words', () => {
    expect(syllabifyWord('beautiful')).toEqual(['beau', 'ti', 'ful']);
    expect(syllabifyWord('together')).toEqual(['to', 'geth', 'er']);
    expect(syllabifyWord('dictation')).toEqual(['dic', 'ta', 'tion']);
    expect(syllabifyWord('practice')).toEqual(['prac', 'tice']);
  });

  it('handles short mono-syllabic words without breaking them', () => {
    expect(syllabifyWord('cat')).toEqual(['cat']);
    expect(syllabifyWord('the')).toEqual(['the']);
  });
});
