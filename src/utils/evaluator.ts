import { WordFeedback, SentenceEvaluation } from '../types';

/**
 * Clean a word token:
 * lowercase, strip leading/trailing punctuation except retain internal apostrophes/hyphens.
 */
export function cleanWord(raw: string): string {
  // Trim whitespace
  let str = raw.trim().toLowerCase();
  // Strip leading and trailing punctuation (quotes, commas, periods, exclamation, question marks, semicolons, brackets)
  str = str.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');
  return str;
}

/**
 * Split sentence into words preserving original token information
 */
export interface TokenInfo {
  raw: string;
  clean: string;
  leadingPunct: string;
  trailingPunct: string;
}

export function tokenizeSentence(sentence: string): TokenInfo[] {
  if (!sentence.trim()) return [];
  
  // Split on whitespace
  const rawTokens = sentence.trim().split(/\s+/);
  return rawTokens.map(raw => {
    const clean = cleanWord(raw);
    const leadingMatch = raw.match(/^[^a-z0-9]+/i);
    const trailingMatch = raw.match(/[^a-z0-9]+$/i);
    const displayWord = raw.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');
    
    return {
      raw: displayWord || raw,
      clean,
      leadingPunct: leadingMatch ? leadingMatch[0] : '',
      trailingPunct: trailingMatch ? trailingMatch[0] : ''
    };
  });
}

/**
 * Compute Levenshtein distance between two strings
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // deletion
          dp[i][j - 1],    // insertion
          dp[i - 1][j - 1] // substitution
        );
      }
    }
  }

  return dp[m][n];
}

interface AlignmentStep {
  type: 'match' | 'substitution' | 'insertion' | 'deletion';
  typedIdx?: number;
  expectedIdx?: number;
}

/**
 * Global sequence alignment using Dynamic Programming (Needleman-Wunsch variant)
 * between typed tokens T and expected tokens E.
 */
export function alignTokens(typed: TokenInfo[], expected: TokenInfo[]): AlignmentStep[] {
  const n = typed.length;
  const m = expected.length;

  // dp[i][j] stores the best score aligning typed[0..i-1] with expected[0..j-1]
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  const traceback: ('diag' | 'up' | 'left')[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill('diag'));

  const MATCH_SCORE = 5;
  const CLOSE_SCORE = 1;
  const MISMATCH_SCORE = -2;
  const GAP_EXPECTED_PENALTY = -1.5; // skipped an expected word
  const GAP_TYPED_PENALTY = -2;      // inserted an extra typed word

  for (let i = 1; i <= n; i++) {
    dp[i][0] = i * GAP_TYPED_PENALTY;
    traceback[i][0] = 'up';
  }
  for (let j = 1; j <= m; j++) {
    dp[0][j] = j * GAP_EXPECTED_PENALTY;
    traceback[0][j] = 'left';
  }

  for (let i = 1; i <= n; i++) {
    const t = typed[i - 1];
    for (let j = 1; j <= m; j++) {
      const e = expected[j - 1];
      
      let scoreChange = MISMATCH_SCORE;
      if (t.clean === e.clean && t.clean.length > 0) {
        scoreChange = MATCH_SCORE;
      } else if (t.clean.length > 3 && e.clean.length > 3) {
        const dist = levenshtein(t.clean, e.clean);
        if (dist <= 2) {
          scoreChange = CLOSE_SCORE;
        }
      }

      const diag = dp[i - 1][j - 1] + scoreChange;
      const up = dp[i - 1][j] + GAP_TYPED_PENALTY;
      const left = dp[i][j - 1] + GAP_EXPECTED_PENALTY;

      let best = diag;
      let dir: 'diag' | 'up' | 'left' = 'diag';

      if (up > best) {
        best = up;
        dir = 'up';
      }
      if (left > best) {
        best = left;
        dir = 'left';
      }

      dp[i][j] = best;
      traceback[i][j] = dir;
    }
  }

  // Trace back path
  let currI = n;
  let currJ = m;
  const steps: AlignmentStep[] = [];

  while (currI > 0 || currJ > 0) {
    if (currI > 0 && currJ > 0 && traceback[currI][currJ] === 'diag') {
      const t = typed[currI - 1];
      const e = expected[currJ - 1];
      const isMatch = t.clean === e.clean && t.clean.length > 0;
      steps.push({
        type: isMatch ? 'match' : 'substitution',
        typedIdx: currI - 1,
        expectedIdx: currJ - 1
      });
      currI--;
      currJ--;
    } else if (currI > 0 && (currJ === 0 || traceback[currI][currJ] === 'up')) {
      steps.push({
        type: 'insertion',
        typedIdx: currI - 1
      });
      currI--;
    } else {
      steps.push({
        type: 'deletion',
        expectedIdx: currJ - 1
      });
      currJ--;
    }
  }

  return steps.reverse();
}

/**
 * Prefix sequence alignment for live typing feedback.
 * Semi-global banded alignment: free trailing gaps on the expected sentence/story.
 * Evaluates in < 2ms even for 1,000-word stories.
 */
export function alignPrefixTokens(
  typed: TokenInfo[],
  expected: TokenInfo[],
  band = 35
): AlignmentStep[] {
  const n = typed.length;
  const m = expected.length;
  if (n === 0 || m === 0) return [];

  // Limit expected search to the typed prefix range + band
  const maxExpected = Math.min(m, n + band);

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(maxExpected + 1).fill(-Infinity));
  const traceback: ('diag' | 'up' | 'left')[][] = Array.from({ length: n + 1 }, () => Array(maxExpected + 1).fill('diag'));

  const MATCH_SCORE = 5;
  const CLOSE_SCORE = 1;
  const MISMATCH_SCORE = -2;
  const GAP_EXPECTED_PENALTY = -2;  // skipped an expected word
  const GAP_TYPED_PENALTY = -2.5;   // inserted an extra typed word

  dp[0][0] = 0;
  for (let i = 1; i <= n; i++) {
    dp[i][0] = i * GAP_TYPED_PENALTY;
    traceback[i][0] = 'up';
  }
  for (let j = 1; j <= maxExpected; j++) {
    dp[0][j] = j * GAP_EXPECTED_PENALTY;
    traceback[0][j] = 'left';
  }

  for (let i = 1; i <= n; i++) {
    const t = typed[i - 1];
    const minJ = Math.max(1, i - band);
    const maxJ = Math.min(maxExpected, i + band);

    for (let j = minJ; j <= maxJ; j++) {
      const e = expected[j - 1];

      let scoreChange = MISMATCH_SCORE;
      if (t.clean === e.clean && t.clean.length > 0) {
        scoreChange = MATCH_SCORE;
      } else if (t.clean.length > 3 && e.clean.length > 3) {
        const dist = levenshtein(t.clean, e.clean);
        if (dist <= 2) {
          scoreChange = CLOSE_SCORE;
        }
      }

      const diag = dp[i - 1][j - 1] + scoreChange;
      const up = dp[i - 1][j] + GAP_TYPED_PENALTY;
      const left = dp[i][j - 1] + GAP_EXPECTED_PENALTY;

      let best = diag;
      let dir: 'diag' | 'up' | 'left' = 'diag';

      if (up > best) {
        best = up;
        dir = 'up';
      }
      if (left > best) {
        best = left;
        dir = 'left';
      }

      dp[i][j] = best;
      traceback[i][j] = dir;
    }
  }

  // Find best ending column for prefix alignment around the typed length
  let bestJ = 1;
  let maxScore = -Infinity;
  const minSearchJ = Math.max(1, n - 15);
  const maxSearchJ = Math.min(maxExpected, n + 20);

  for (let j = minSearchJ; j <= maxSearchJ; j++) {
    if (dp[n][j] > maxScore) {
      maxScore = dp[n][j];
      bestJ = j;
    }
  }

  // If no peak in search band, fallback to best score across entire row
  if (maxScore === -Infinity) {
    for (let j = 1; j <= maxExpected; j++) {
      if (dp[n][j] > maxScore) {
        maxScore = dp[n][j];
        bestJ = j;
      }
    }
  }

  let currI = n;
  let currJ = bestJ;
  const steps: AlignmentStep[] = [];

  while (currI > 0 || currJ > 0) {
    if (currI > 0 && currJ > 0 && traceback[currI][currJ] === 'diag') {
      const t = typed[currI - 1];
      const e = expected[currJ - 1];
      const isMatch = t.clean === e.clean && t.clean.length > 0;
      steps.push({
        type: isMatch ? 'match' : 'substitution',
        typedIdx: currI - 1,
        expectedIdx: currJ - 1
      });
      currI--;
      currJ--;
    } else if (currI > 0 && (currJ === 0 || traceback[currI][currJ] === 'up')) {
      steps.push({
        type: 'insertion',
        typedIdx: currI - 1
      });
      currI--;
    } else {
      steps.push({
        type: 'deletion',
        expectedIdx: currJ - 1
      });
      currJ--;
    }
  }

  return steps.reverse();
}

/**
 * Generate live feedback for the feedback panel.
 * Only attempted words and missing word slots are displayed!
 * Correct words in green, incorrect words in red, missing words in slot.
 * Trailing untyped words remain completely invisible.
 */
export function getLiveFeedback(expectedSentence: string, userTypedInput: string): WordFeedback[] {
  const typedTokens = tokenizeSentence(userTypedInput);
  if (typedTokens.length === 0) return [];

  const expectedTokens = tokenizeSentence(expectedSentence);
  if (expectedTokens.length === 0) return [];

  const steps = alignPrefixTokens(typedTokens, expectedTokens);
  const feedbacks: WordFeedback[] = [];

  for (const step of steps) {
    if (step.type === 'match' && step.typedIdx !== undefined && step.expectedIdx !== undefined) {
      const e = expectedTokens[step.expectedIdx];
      feedbacks.push({
        word: e.raw,
        expectedWord: e.raw,
        status: 'correct',
        punctuation: e.trailingPunct,
        expectedPunctuation: e.trailingPunct
      });
    } else if (step.type === 'substitution' && step.typedIdx !== undefined && step.expectedIdx !== undefined) {
      const t = typedTokens[step.typedIdx];
      const e = expectedTokens[step.expectedIdx];
      feedbacks.push({
        word: t.raw,
        expectedWord: e.raw,
        status: 'incorrect',
        punctuation: t.trailingPunct,
        expectedPunctuation: e.trailingPunct
      });
    } else if (step.type === 'insertion' && step.typedIdx !== undefined) {
      const t = typedTokens[step.typedIdx];
      feedbacks.push({
        word: t.raw,
        status: 'incorrect',
        punctuation: t.trailingPunct
      });
    } else if (step.type === 'deletion' && step.expectedIdx !== undefined) {
      // Missing word slot!
      const e = expectedTokens[step.expectedIdx];
      feedbacks.push({
        word: '___',
        expectedWord: e.raw,
        status: 'missing',
        expectedPunctuation: e.trailingPunct
      });
    }
  }

  return feedbacks;
}

/**
 * Full Sentence Evaluation when submitted or finished.
 */
export function evaluateSentence(expectedSentence: string, userTypedInput: string): SentenceEvaluation {
  const expectedTokens = tokenizeSentence(expectedSentence);
  const typedTokens = tokenizeSentence(userTypedInput);

  const steps = alignTokens(typedTokens, expectedTokens);
  const feedbacks: WordFeedback[] = [];
  const missedWords: string[] = [];
  const extraWords: string[] = [];
  const misspelledWords: { typed: string; expected: string }[] = [];

  let correctWordsCount = 0;
  let incorrectWordsCount = 0;

  for (const step of steps) {
    if (step.type === 'match' && step.typedIdx !== undefined && step.expectedIdx !== undefined) {
      const e = expectedTokens[step.expectedIdx];
      correctWordsCount++;
      feedbacks.push({
        word: e.raw,
        expectedWord: e.raw,
        status: 'correct',
        punctuation: e.trailingPunct,
        expectedPunctuation: e.trailingPunct
      });
    } else if (step.type === 'substitution' && step.typedIdx !== undefined && step.expectedIdx !== undefined) {
      const t = typedTokens[step.typedIdx];
      const e = expectedTokens[step.expectedIdx];
      incorrectWordsCount++;
      misspelledWords.push({ typed: t.raw, expected: e.raw });
      feedbacks.push({
        word: t.raw,
        expectedWord: e.raw,
        status: 'incorrect',
        punctuation: t.trailingPunct,
        expectedPunctuation: e.trailingPunct
      });
    } else if (step.type === 'insertion' && step.typedIdx !== undefined) {
      const t = typedTokens[step.typedIdx];
      incorrectWordsCount++;
      extraWords.push(t.raw);
      feedbacks.push({
        word: t.raw,
        status: 'incorrect',
        punctuation: t.trailingPunct
      });
    } else if (step.type === 'deletion' && step.expectedIdx !== undefined) {
      const e = expectedTokens[step.expectedIdx];
      incorrectWordsCount++;
      missedWords.push(e.raw);
    }
  }

  const totalTokens = expectedTokens.length;
  const isFullyCorrect = correctWordsCount === totalTokens && incorrectWordsCount === 0 && missedWords.length === 0 && extraWords.length === 0;
  
  const accuracy = totalTokens > 0 
    ? Math.max(0, Math.round((correctWordsCount / Math.max(totalTokens, typedTokens.length)) * 100))
    : 100;

  return {
    isFullyCorrect,
    accuracy,
    expectedText: expectedSentence,
    userText: userTypedInput,
    feedbacks,
    correctWordsCount,
    incorrectWordsCount,
    missedWords,
    extraWords,
    misspelledWords
  };
}
