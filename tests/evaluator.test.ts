import { describe, it, expect } from 'vitest';
import { getLiveFeedback, evaluateSentence, cleanWord, tokenizeSentence } from '../src/utils/evaluator';

describe('Word-by-word Evaluator', () => {
  it('cleans words correctly', () => {
    expect(cleanWord('The')).toBe('the');
    expect(cleanWord('bed.')).toBe('bed');
    expect(cleanWord('"Hello!"')).toBe('hello');
    expect(cleanWord("don't")).toBe("don't");
    expect(cleanWord('well-known')).toBe('well-known');
  });

  it('matches prompt example: The cat is on the bed. -> The cat are', () => {
    const expected = 'The cat is on the bed.';
    const typed = 'The cat are';
    const feedbacks = getLiveFeedback(expected, typed);

    expect(feedbacks.length).toBe(3);
    // "The" correct
    expect(feedbacks[0].status).toBe('correct');
    expect(feedbacks[0].word).toBe('The');
    // "cat" correct
    expect(feedbacks[1].status).toBe('correct');
    expect(feedbacks[1].word).toBe('cat');
    // "are" incorrect, displays typed word in red!
    expect(feedbacks[2].status).toBe('incorrect');
    expect(feedbacks[2].word).toBe('are');
    // Untyped words remain invisible! (length is 3, not 6)
  });

  it('handles case-insensitivity without marking correct words wrong', () => {
    const expected = 'The cat is on the bed.';
    const typed = 'the CAT is ON';
    const feedbacks = getLiveFeedback(expected, typed);

    expect(feedbacks.length).toBe(4);
    expect(feedbacks.every(f => f.status === 'correct')).toBe(true);
  });

  it('preserves punctuation in feedback for correct words', () => {
    const expected = 'Wait, look at that dog!';
    const typed = 'Wait look';
    const feedbacks = getLiveFeedback(expected, typed);

    expect(feedbacks[0].status).toBe('correct');
    expect(feedbacks[0].expectedPunctuation).toBe(',');
  });

  it('evaluates skipped word and shows missing word space slot above', () => {
    const expected = 'The big brown dog runs fast.';
    const typed = 'The brown dog runs';
    const feedbacks = getLiveFeedback(expected, typed);

    // "The" (green), "___" (missing space slot), "brown" (green), "dog" (green), "runs" (green)
    expect(feedbacks.length).toBe(5);
    expect(feedbacks[0].status).toBe('correct');
    expect(feedbacks[0].word).toBe('The');
    // Missing space slot for skipped "big"
    expect(feedbacks[1].status).toBe('missing');
    expect(feedbacks[1].word).toBe('___');
    // Remaining typed words continue matching correctly in green!
    expect(feedbacks[2].status).toBe('correct');
    expect(feedbacks[2].word).toBe('brown');
    expect(feedbacks[3].status).toBe('correct');
    expect(feedbacks[3].word).toBe('dog');
    expect(feedbacks[4].status).toBe('correct');
    expect(feedbacks[4].word).toBe('runs');
    // "fast." after "runs" remains untyped and invisible!
  });

  it('evaluates inserted extra word cleanly', () => {
    const expected = 'The cat slept.';
    const typed = 'The little cat slept';
    const feedbacks = getLiveFeedback(expected, typed);

    expect(feedbacks.length).toBe(4);
    expect(feedbacks[0].status).toBe('correct');
    expect(feedbacks[0].word).toBe('The');
    // "little" was not in expected sentence
    expect(feedbacks[1].status).toBe('incorrect');
    expect(feedbacks[1].word).toBe('little');
    // subsequent words still match correctly!
    expect(feedbacks[2].status).toBe('correct');
    expect(feedbacks[2].word).toBe('cat');
    expect(feedbacks[3].status).toBe('correct');
    expect(feedbacks[3].word).toBe('slept');
  });

  it('provides full evaluation on sentence submission', () => {
    const expected = 'She loves to read books in the evening.';
    const typed = 'She love to read book in the evening.';
    const evaluation = evaluateSentence(expected, typed);

    expect(evaluation.isFullyCorrect).toBe(false);
    expect(evaluation.misspelledWords.length).toBeGreaterThan(0);
    expect(evaluation.correctWordsCount).toBeGreaterThan(5);
    expect(evaluation.accuracy).toBeGreaterThan(60);
  });

  it('detects 100% correct sentence', () => {
    const expected = 'We go to the park.';
    const typed = 'We go to the park.';
    const evaluation = evaluateSentence(expected, typed);

    expect(evaluation.isFullyCorrect).toBe(true);
    expect(evaluation.accuracy).toBe(100);
    expect(evaluation.missedWords.length).toBe(0);
    expect(evaluation.misspelledWords.length).toBe(0);
  });

  it('evaluates continuous paragraph story without clearing', () => {
    const story = 'I am Sam. I am a boy. I see a cat. The cat is fat.';
    // User types across first 3 sentences continuously
    const typedStory = 'I am Sam. I am a boy. I see a cat.';
    const feedbacks = getLiveFeedback(story, typedStory);

    expect(feedbacks.length).toBe(11);
    expect(feedbacks.every(f => f.status === 'correct')).toBe(true);
    // Trailing sentence "The cat is fat." remains invisible!
  });

  it('detects typos and missing words in continuous story flow', () => {
    const story = 'I am Sam. I am a boy. I see a cat. The cat is fat.';
    // User types "Sam" -> "Sem" (typo) and forgets "a" in "a cat"
    const typedStory = 'I am Sem. I am a boy. I see cat.';
    const feedbacks = getLiveFeedback(story, typedStory);

    // Feedbacks should mark "Sem" as incorrect, and indicate missing word for "a"
    const semFeedback = feedbacks.find(f => f.word.toLowerCase() === 'sem');
    expect(semFeedback?.status).toBe('incorrect');

    const missingFeedback = feedbacks.find(f => f.status === 'missing');
    expect(missingFeedback).toBeDefined();
  });
});
