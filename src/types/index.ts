export type DifficultyLevel = 1 | 2 | 3;

export type VoiceAccent = 'en-IN' | 'en-US' | 'en-GB' | 'all';

export interface LessonSentence {
  id: string;
  text: string;
  chunks: string[];
}

export interface Lesson {
  id: number;
  title: string;
  level: DifficultyLevel;
  levelName: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  wordCount: number;
  sentences: LessonSentence[];
}

export interface WordFeedback {
  word: string;
  expectedWord?: string;
  status: 'correct' | 'incorrect' | 'missing';
  punctuation?: string;
  expectedPunctuation?: string;
}

export interface SentenceEvaluation {
  isFullyCorrect: boolean;
  accuracy: number;
  expectedText: string;
  userText: string;
  feedbacks: WordFeedback[];
  correctWordsCount: number;
  incorrectWordsCount: number;
  missedWords: string[];
  extraWords: string[];
  misspelledWords: { typed: string; expected: string }[];
}

export interface LessonProgress {
  lessonId: number;
  currentSentenceIndex: number;
  activeChunkIndex?: number;
  typedText?: string;
  completed: boolean;
  completedAt?: string;
  bestAccuracy?: number;
  totalAttempts: number;
  totalCorrectWords: number;
  totalIncorrectWords: number;
  timeSpentSeconds: number;
  misspelledWordCounts: Record<string, number>;
}

export interface UserSettings {
  speechSpeed: number; // 0.5 to 1.5, default 0.8
  speechPitch: number;
  selectedVoiceURI: string | null;
  voiceAccent?: VoiceAccent; // 'en-IN' (Indian), 'en-US', 'en-GB', 'all'
  repeatCount: 1 | 2 | 3;
  wordsPerChunk: number; // 0 for full sentence, or 1, 2, 3, 4, 5 (default 3)
  chunkThreshold: number; // default 15 words
  dictationPauseMs: number;
  autoAdvanceOnCorrect: boolean;
  autoAdvanceDelayMs: number;
  soundEffects: boolean;
}
