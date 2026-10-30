import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DATA_DIR = path.join(__dirname, 'data');

function resolveDbPath() {
  if (process.env.DICTATION_DB_PATH) {
    return process.env.DICTATION_DB_PATH;
  }
  if (process.versions && process.versions.electron) {
    try {
      const electron = require('electron');
      const app = electron.app || electron.default?.app;
      if (app && (app.isPackaged || !fs.existsSync(DEFAULT_DATA_DIR))) {
        return path.join(app.getPath('userData'), 'dictation.db');
      }
    } catch {}
  }
  return path.join(DEFAULT_DATA_DIR, 'dictation.db');
}

export const DB_PATH = resolveDbPath();
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      level INTEGER NOT NULL,
      level_name TEXT NOT NULL,
      description TEXT,
      word_count INTEGER,
      sentence_count INTEGER,
      sentences_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      lesson_id INTEGER PRIMARY KEY,
      current_sentence_index INTEGER DEFAULT 0,
      active_chunk_index INTEGER DEFAULT 0,
      typed_text TEXT DEFAULT '',
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      best_accuracy REAL,
      total_attempts INTEGER DEFAULT 1,
      total_correct_words INTEGER DEFAULT 0,
      total_incorrect_words INTEGER DEFAULT 0,
      time_spent_seconds INTEGER DEFAULT 0,
      misspelled_json TEXT DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS last_active (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      lesson_id INTEGER DEFAULT 1,
      sentence_index INTEGER DEFAULT 0,
      active_chunk_index INTEGER DEFAULT 0,
      typed_text TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      speech_speed REAL DEFAULT 0.8,
      speech_pitch REAL DEFAULT 1.0,
      selected_voice_uri TEXT,
      voice_accent TEXT DEFAULT 'en-IN',
      evaluation_mode TEXT DEFAULT 'relaxed',
      announce_punctuation INTEGER DEFAULT 0,
      repeat_count INTEGER DEFAULT 1,
      words_per_chunk INTEGER DEFAULT 3,
      chunk_threshold INTEGER DEFAULT 15,
      dictation_pause_ms INTEGER DEFAULT 2500,
      auto_advance_on_correct INTEGER DEFAULT 1,
      auto_advance_delay_ms INTEGER DEFAULT 1000,
      sound_effects INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO last_active (id, lesson_id, sentence_index, active_chunk_index, typed_text)
    VALUES (1, 1, 0, 0, '');

    INSERT OR IGNORE INTO settings (
      id, speech_speed, speech_pitch, selected_voice_uri, voice_accent, evaluation_mode,
      announce_punctuation, repeat_count, words_per_chunk, chunk_threshold, dictation_pause_ms,
      auto_advance_on_correct, auto_advance_delay_ms, sound_effects
    ) VALUES (
      1, 0.8, 1.0, NULL, 'en-IN', 'relaxed',
      0, 1, 3, 15, 2500,
      1, 1000, 1
    );
  `);

  // Seed lessons from JSON files if lessons table is empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM lessons').get();
  if (!countRow || countRow.count === 0) {
    seedLessonsFromDisk();
  }
}

export function seedLessonsFromDisk() {
  const lessonsDir = path.join(DEFAULT_DATA_DIR, 'lessons');
  const manifestFile = path.join(DEFAULT_DATA_DIR, 'lessonsManifest.json');

  if (!fs.existsSync(manifestFile) || !fs.existsSync(lessonsDir)) {
    console.warn('Cannot seed lessons: missing manifest or lessons directory');
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO lessons (
      id, title, level, level_name, description, word_count, sentence_count, sentences_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((lessons) => {
    for (const item of lessons) {
      const lessonFile = path.join(lessonsDir, item.fileName);
      if (fs.existsSync(lessonFile)) {
        const fullData = JSON.parse(fs.readFileSync(lessonFile, 'utf8'));
        insertStmt.run(
          fullData.id,
          fullData.title,
          fullData.level,
          fullData.levelName,
          fullData.description,
          fullData.wordCount,
          fullData.sentences.length,
          JSON.stringify(fullData.sentences)
        );
      }
    }
  });

  insertMany(manifest);
  console.log(`Seeded ${manifest.length} lessons into SQLite database successfully.`);
}

// DAO Helpers
export const lessonsDao = {
  getAll: () => {
    return db.prepare(`
      SELECT id, title, level, level_name as levelName, description, word_count as wordCount, sentence_count as sentenceCount,
      ('lesson-' || printf('%03d', id) || '.json') as fileName
      FROM lessons ORDER BY id ASC
    `).all();
  },

  getById: (id) => {
    const row = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      level: row.level,
      levelName: row.level_name,
      description: row.description,
      wordCount: row.word_count,
      sentences: JSON.parse(row.sentences_json)
    };
  }
};

export const progressDao = {
  getAll: () => {
    const rows = db.prepare('SELECT * FROM lesson_progress').all();
    const map = {};
    for (const r of rows) {
      map[r.lesson_id] = {
        lessonId: r.lesson_id,
        currentSentenceIndex: r.current_sentence_index,
        activeChunkIndex: r.active_chunk_index,
        typedText: r.typed_text,
        completed: Boolean(r.completed),
        completedAt: r.completed_at,
        bestAccuracy: r.best_accuracy,
        totalAttempts: r.total_attempts,
        totalCorrectWords: r.total_correct_words,
        totalIncorrectWords: r.total_incorrect_words,
        timeSpentSeconds: r.time_spent_seconds,
        misspelledWordCounts: JSON.parse(r.misspelled_json || '{}')
      };
    }
    return map;
  },

  getById: (lessonId) => {
    const r = db.prepare('SELECT * FROM lesson_progress WHERE lesson_id = ?').get(lessonId);
    if (!r) return null;
    return {
      lessonId: r.lesson_id,
      currentSentenceIndex: r.current_sentence_index,
      activeChunkIndex: r.active_chunk_index,
      typedText: r.typed_text,
      completed: Boolean(r.completed),
      completedAt: r.completed_at,
      bestAccuracy: r.best_accuracy,
      totalAttempts: r.total_attempts,
      totalCorrectWords: r.total_correct_words,
      totalIncorrectWords: r.total_incorrect_words,
      timeSpentSeconds: r.time_spent_seconds,
      misspelledWordCounts: JSON.parse(r.misspelled_json || '{}')
    };
  },

  save: (p) => {
    const stmt = db.prepare(`
      INSERT INTO lesson_progress (
        lesson_id, current_sentence_index, active_chunk_index, typed_text,
        completed, completed_at, best_accuracy, total_attempts,
        total_correct_words, total_incorrect_words, time_spent_seconds,
        misspelled_json, updated_at
      ) VALUES (
        @lessonId, @currentSentenceIndex, @activeChunkIndex, @typedText,
        @completed, @completedAt, @bestAccuracy, @totalAttempts,
        @totalCorrectWords, @totalIncorrectWords, @timeSpentSeconds,
        @misspelledJson, CURRENT_TIMESTAMP
      )
      ON CONFLICT(lesson_id) DO UPDATE SET
        current_sentence_index = excluded.current_sentence_index,
        active_chunk_index = excluded.active_chunk_index,
        typed_text = excluded.typed_text,
        completed = excluded.completed,
        completed_at = excluded.completed_at,
        best_accuracy = excluded.best_accuracy,
        total_attempts = excluded.total_attempts,
        total_correct_words = excluded.total_correct_words,
        total_incorrect_words = excluded.total_incorrect_words,
        time_spent_seconds = excluded.time_spent_seconds,
        misspelled_json = excluded.misspelled_json,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run({
      lessonId: p.lessonId,
      currentSentenceIndex: p.currentSentenceIndex || 0,
      activeChunkIndex: p.activeChunkIndex || 0,
      typedText: p.typedText || '',
      completed: p.completed ? 1 : 0,
      completedAt: p.completedAt || null,
      bestAccuracy: p.bestAccuracy || null,
      totalAttempts: p.totalAttempts || 1,
      totalCorrectWords: p.totalCorrectWords || 0,
      totalIncorrectWords: p.totalIncorrectWords || 0,
      timeSpentSeconds: p.timeSpentSeconds || 0,
      misspelledJson: JSON.stringify(p.misspelledWordCounts || {})
    });
  },

  saveStory: (lessonId, typedText, activeChunkIndex = 0) => {
    const stmt = db.prepare(`
      INSERT INTO lesson_progress (
        lesson_id, typed_text, active_chunk_index, updated_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(lesson_id) DO UPDATE SET
        typed_text = excluded.typed_text,
        active_chunk_index = excluded.active_chunk_index,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(lessonId, typedText, activeChunkIndex);
  },

  resetAll: () => {
    db.prepare('DELETE FROM lesson_progress').run();
    db.prepare(`
      UPDATE last_active SET
        lesson_id = 1,
        sentence_index = 0,
        active_chunk_index = 0,
        typed_text = '',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run();
  }
};

export const lastActiveDao = {
  get: () => {
    const r = db.prepare('SELECT * FROM last_active WHERE id = 1').get();
    if (!r) return { lessonId: 1, sentenceIndex: 0, activeChunkIndex: 0, typedText: '' };
    return {
      lessonId: r.lesson_id,
      sentenceIndex: r.sentence_index,
      activeChunkIndex: r.active_chunk_index,
      typedText: r.typed_text
    };
  },

  save: (state) => {
    db.prepare(`
      INSERT INTO last_active (id, lesson_id, sentence_index, active_chunk_index, typed_text, updated_at)
      VALUES (1, @lessonId, @sentenceIndex, @activeChunkIndex, @typedText, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        lesson_id = excluded.lesson_id,
        sentence_index = excluded.sentence_index,
        active_chunk_index = excluded.active_chunk_index,
        typed_text = excluded.typed_text,
        updated_at = CURRENT_TIMESTAMP
    `).run({
      lessonId: state.lessonId || 1,
      sentenceIndex: state.sentenceIndex || 0,
      activeChunkIndex: state.activeChunkIndex || 0,
      typedText: state.typedText || ''
    });
  }
};

export const settingsDao = {
  get: () => {
    const r = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (!r) {
      return {
        speechSpeed: 0.8,
        speechPitch: 1.0,
        selectedVoiceURI: null,
        voiceAccent: 'en-IN',
        evaluationMode: 'relaxed',
        announcePunctuation: false,
        repeatCount: 1,
        wordsPerChunk: 3,
        chunkThreshold: 15,
        dictationPauseMs: 2500,
        autoAdvanceOnCorrect: true,
        autoAdvanceDelayMs: 1000,
        soundEffects: true
      };
    }
    return {
      speechSpeed: r.speech_speed,
      speechPitch: r.speech_pitch,
      selectedVoiceURI: r.selected_voice_uri,
      voiceAccent: r.voice_accent,
      evaluationMode: r.evaluation_mode,
      announcePunctuation: Boolean(r.announce_punctuation),
      repeatCount: r.repeat_count,
      wordsPerChunk: r.words_per_chunk,
      chunkThreshold: r.chunk_threshold,
      dictationPauseMs: r.dictation_pause_ms,
      autoAdvanceOnCorrect: Boolean(r.auto_advance_on_correct),
      autoAdvanceDelayMs: r.auto_advance_delay_ms,
      soundEffects: Boolean(r.sound_effects)
    };
  },

  save: (s) => {
    const current = settingsDao.get();
    const updated = { ...current, ...s };
    db.prepare(`
      INSERT INTO settings (
        id, speech_speed, speech_pitch, selected_voice_uri, voice_accent,
        evaluation_mode, announce_punctuation, repeat_count, words_per_chunk,
        chunk_threshold, dictation_pause_ms, auto_advance_on_correct,
        auto_advance_delay_ms, sound_effects, updated_at
      ) VALUES (
        1, @speechSpeed, @speechPitch, @selectedVoiceURI, @voiceAccent,
        @evaluationMode, @announcePunctuation, @repeatCount, @wordsPerChunk,
        @chunkThreshold, @dictationPauseMs, @autoAdvanceOnCorrect,
        @autoAdvanceDelayMs, @soundEffects, CURRENT_TIMESTAMP
      )
      ON CONFLICT(id) DO UPDATE SET
        speech_speed = excluded.speech_speed,
        speech_pitch = excluded.speech_pitch,
        selected_voice_uri = excluded.selected_voice_uri,
        voice_accent = excluded.voice_accent,
        evaluation_mode = excluded.evaluation_mode,
        announce_punctuation = excluded.announce_punctuation,
        repeat_count = excluded.repeat_count,
        words_per_chunk = excluded.words_per_chunk,
        chunk_threshold = excluded.chunk_threshold,
        dictation_pause_ms = excluded.dictation_pause_ms,
        auto_advance_on_correct = excluded.auto_advance_on_correct,
        auto_advance_delay_ms = excluded.auto_advance_delay_ms,
        sound_effects = excluded.sound_effects,
        updated_at = CURRENT_TIMESTAMP
    `).run({
      speechSpeed: updated.speechSpeed ?? 0.8,
      speechPitch: updated.speechPitch ?? 1.0,
      selectedVoiceURI: updated.selectedVoiceURI ?? null,
      voiceAccent: updated.voiceAccent ?? 'en-IN',
      evaluationMode: updated.evaluationMode ?? 'relaxed',
      announcePunctuation: updated.announcePunctuation ? 1 : 0,
      repeatCount: updated.repeatCount ?? 1,
      wordsPerChunk: updated.wordsPerChunk ?? 3,
      chunkThreshold: updated.chunkThreshold ?? 15,
      dictationPauseMs: updated.dictationPauseMs ?? 2500,
      autoAdvanceOnCorrect: updated.autoAdvanceOnCorrect ? 1 : 0,
      autoAdvanceDelayMs: updated.autoAdvanceDelayMs ?? 1000,
      soundEffects: updated.soundEffects ? 1 : 0
    });
    return settingsDao.get();
  }
};

// Auto-initialize when imported
initDatabase();
