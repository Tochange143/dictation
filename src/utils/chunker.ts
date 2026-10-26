/**
 * Sentence and Story chunker for text-to-speech.
 * Supports:
 * 1. Fixed word-count chunking (e.g. 3 words at once, 2 words at once, etc.)
 * 2. Natural clause-based chunking for long sentences
 * 3. Continuous story chunking across entire lessons
 */

export interface StoryChunk {
  chunkIndex: number;
  sentenceIndex: number;
  text: string;
  chunkWords: string[];
  cumulativeWordsBefore: number; // total expected words before this chunk in the whole lesson
  cumulativeWordsEnd: number;    // total expected words after this chunk
}

/**
 * Split sentence into exact chunks of N words (e.g. 3 words at a time).
 * If wordsPerChunk <= 0, returns the full sentence as one chunk.
 */
export function getWordChunks(sentence: string, wordsPerChunk = 3): string[] {
  const trimmed = sentence.trim();
  if (!trimmed) return [];

  if (wordsPerChunk <= 0) {
    return [trimmed];
  }

  const rawWords = trimmed.split(/\s+/);
  if (rawWords.length <= wordsPerChunk) {
    return [trimmed];
  }

  const chunks: string[] = [];
  for (let i = 0; i < rawWords.length; i += wordsPerChunk) {
    const chunkWords = rawWords.slice(i, i + wordsPerChunk);
    chunks.push(chunkWords.join(' '));
  }

  return chunks;
}

/**
 * Build story chunks for continuous dictation across an entire lesson.
 * Words are chunked within sentence boundaries so sentences sound grammatically coherent.
 */
export function getStoryChunks(
  sentences: { text: string }[],
  wordsPerChunk = 3
): StoryChunk[] {
  const chunks: StoryChunk[] = [];
  let chunkCounter = 0;
  let runningWordCount = 0;

  for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
    const sText = sentences[sIdx].text.trim();
    if (!sText) continue;

    const sentenceChunkTexts = getWordChunks(sText, wordsPerChunk);

    for (const chunkText of sentenceChunkTexts) {
      const words = chunkText.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      const cumulativeWordsBefore = runningWordCount;
      const cumulativeWordsEnd = runningWordCount + wordCount;

      chunks.push({
        chunkIndex: chunkCounter++,
        sentenceIndex: sIdx,
        text: chunkText,
        chunkWords: words,
        cumulativeWordsBefore,
        cumulativeWordsEnd
      });

      runningWordCount = cumulativeWordsEnd;
    }
  }

  return chunks;
}

/**
 * Natural clause-based chunker for full sentence mode
 */
export function chunkSentence(sentence: string, maxWords = 15): string[] {
  const trimmed = sentence.trim();
  if (!trimmed) return [];

  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) {
    return [trimmed];
  }

  const clauseRegex = /([^,;:—]+(?:[,;:—]|$))/g;
  const rawClauses = trimmed.match(clauseRegex) || [trimmed];

  const resultChunks: string[] = [];
  let currentWords: string[] = [];

  for (const clause of rawClauses) {
    const clauseTrimmed = clause.trim();
    if (!clauseTrimmed) continue;

    const clauseWordList = clauseTrimmed.split(/\s+/);

    if (currentWords.length > 0 && currentWords.length + clauseWordList.length > maxWords) {
      resultChunks.push(currentWords.join(' '));
      currentWords = [];
    }

    if (clauseWordList.length > maxWords) {
      const subChunks = breakLongClause(clauseTrimmed, maxWords);
      for (let i = 0; i < subChunks.length; i++) {
        const sub = subChunks[i];
        if (i === subChunks.length - 1 && subChunks.length > 1) {
          const subWords = sub.split(/\s+/);
          if (subWords.length < maxWords / 2) {
            currentWords = subWords;
            continue;
          }
        }
        resultChunks.push(sub);
      }
    } else {
      currentWords.push(...clauseWordList);
    }
  }

  if (currentWords.length > 0) {
    resultChunks.push(currentWords.join(' '));
  }

  const cleanChunks = resultChunks.map(c => c.trim()).filter(c => c.length > 0);
  return cleanChunks.length > 0 ? cleanChunks : [trimmed];
}

function breakLongClause(clause: string, maxWords: number): string[] {
  const words = clause.split(/\s+/);
  if (words.length <= maxWords) return [clause];

  const conjunctions = new Set([
    'and', 'but', 'because', 'although', 'while', 'when', 'where', 'after', 
    'before', 'since', 'until', 'so', 'or', 'as', 'that', 'which', 'who', 'with', 'by', 'for', 'about'
  ]);

  const chunks: string[] = [];
  let current: string[] = [];

  for (const word of words) {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (current.length >= Math.floor(maxWords / 2) && conjunctions.has(clean)) {
      chunks.push(current.join(' '));
      current = [word];
    } else if (current.length >= maxWords) {
      chunks.push(current.join(' '));
      current = [word];
    } else {
      current.push(word);
    }
  }

  if (current.length > 0) {
    chunks.push(current.join(' '));
  }

  return chunks;
}
