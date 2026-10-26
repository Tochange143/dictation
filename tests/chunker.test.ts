import { describe, it, expect } from 'vitest';
import { chunkSentence, getWordChunks, getStoryChunks } from '../src/utils/chunker';

describe('Sentence Chunker & Word-Chunk Dictation', () => {
  it('splits sentence into 3 words at once by default', () => {
    const text = 'The cat is on the bed.';
    const chunks = getWordChunks(text, 3);
    expect(chunks).toEqual(['The cat is', 'on the bed.']);
  });

  it('handles custom N-words chunk size (2 words, 4 words)', () => {
    const text = 'We go to the park.';
    expect(getWordChunks(text, 2)).toEqual(['We go', 'to the', 'park.']);
    expect(getWordChunks(text, 4)).toEqual(['We go to the', 'park.']);
  });

  it('returns full sentence when wordsPerChunk <= 0', () => {
    const text = 'The cat is on the bed.';
    expect(getWordChunks(text, 0)).toEqual(['The cat is on the bed.']);
  });

  it('does not split short sentences in clause chunker', () => {
    const text = 'The cat is on the bed.';
    const chunks = chunkSentence(text, 15);
    expect(chunks).toEqual(['The cat is on the bed.']);
  });

  it('splits long sentences at commas and conjunctions', () => {
    const text = 'When the morning sun rose over the quiet valley, the little birds began to sing their cheerful songs in the trees, and the village slowly woke up.';
    const chunks = chunkSentence(text, 12);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      const words = chunk.split(/\s+/);
      expect(words.length).toBeLessThanOrEqual(18);
    }
  });

  it('builds coherent story chunks across multiple sentences', () => {
    const sentences = [
      { text: 'I am Sam.' },
      { text: 'I am a boy.' },
      { text: 'I see a cat.' }
    ];
    const storyChunks = getStoryChunks(sentences, 3);
    // Sentence 0: 3 words -> 1 chunk
    // Sentence 1: 4 words -> 2 chunks ("I am a", "boy.")
    // Sentence 2: 4 words -> 2 chunks ("I see a", "cat.")
    expect(storyChunks.length).toBe(5);
    expect(storyChunks[0].text).toBe('I am Sam.');
    expect(storyChunks[0].cumulativeWordsEnd).toBe(3);

    expect(storyChunks[1].text).toBe('I am a');
    expect(storyChunks[1].cumulativeWordsEnd).toBe(6);

    expect(storyChunks[2].text).toBe('boy.');
    expect(storyChunks[2].cumulativeWordsEnd).toBe(7);

    expect(storyChunks[3].text).toBe('I see a');
    expect(storyChunks[3].cumulativeWordsEnd).toBe(10);

    expect(storyChunks[4].text).toBe('cat.');
    expect(storyChunks[4].cumulativeWordsEnd).toBe(11);
  });
});
