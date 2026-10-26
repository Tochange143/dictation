import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Persistent Data Storage Directory
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const LAST_ACTIVE_FILE = path.join(DATA_DIR, 'lastActive.json');

function readJsonFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Progress Endpoints
app.get('/api/progress', (req, res) => {
  const progress = readJsonFile(PROGRESS_FILE, {});
  res.json(progress);
});

app.post('/api/progress', (req, res) => {
  const newProgress = req.body;
  if (!newProgress || typeof newProgress.lessonId !== 'number') {
    return res.status(400).json({ error: 'Invalid progress data: lessonId is required' });
  }

  const all = readJsonFile(PROGRESS_FILE, {});
  all[newProgress.lessonId] = {
    ...(all[newProgress.lessonId] || {}),
    ...newProgress,
    updatedAt: new Date().toISOString()
  };

  writeJsonFile(PROGRESS_FILE, all);
  res.json({ success: true, progress: all[newProgress.lessonId] });
});

// Settings Endpoints
app.get('/api/settings', (req, res) => {
  const defaultSettings = {
    speechSpeed: 0.8,
    speechPitch: 1.0,
    selectedVoiceURI: null,
    repeatCount: 1,
    wordsPerChunk: 3, // Default 3 words at once!
    dictationPauseMs: 2500,
    autoAdvanceOnCorrect: true,
    autoAdvanceDelayMs: 1000,
    soundEffects: true
  };
  const settings = readJsonFile(SETTINGS_FILE, defaultSettings);
  res.json({ ...defaultSettings, ...settings });
});

app.post('/api/settings', (req, res) => {
  const currentSettings = readJsonFile(SETTINGS_FILE, {});
  const updated = { ...currentSettings, ...req.body, updatedAt: new Date().toISOString() };
  writeJsonFile(SETTINGS_FILE, updated);
  res.json({ success: true, settings: updated });
});

// Last Active State Endpoints
app.get('/api/last-active', (req, res) => {
  const lastActive = readJsonFile(LAST_ACTIVE_FILE, { lessonId: 1, sentenceIndex: 0, activeChunkIndex: 0, typedText: '' });
  res.json(lastActive);
});

app.post('/api/last-active', (req, res) => {
  const { lessonId, sentenceIndex, activeChunkIndex, typedText } = req.body;
  const lid = Number(lessonId) || 1;
  const state = {
    lessonId: lid,
    sentenceIndex: Number(sentenceIndex) || 0,
    activeChunkIndex: Number(activeChunkIndex) || 0,
    typedText: typeof typedText === 'string' ? typedText : '',
    updatedAt: new Date().toISOString()
  };
  writeJsonFile(LAST_ACTIVE_FILE, state);

  // Synchronously update per-lesson progress so typed text is preserved per lesson!
  const allProgress = readJsonFile(PROGRESS_FILE, {});
  allProgress[lid] = {
    ...(allProgress[lid] || { lessonId: lid }),
    sentenceIndex: state.sentenceIndex,
    activeChunkIndex: state.activeChunkIndex,
    typedText: state.typedText,
    updatedAt: state.updatedAt
  };
  writeJsonFile(PROGRESS_FILE, allProgress);

  res.json({ success: true, lastActive: state });
});

// Reset Progress
app.post('/api/reset', (req, res) => {
  writeJsonFile(PROGRESS_FILE, {});
  writeJsonFile(LAST_ACTIVE_FILE, { lessonId: 1, sentenceIndex: 0, activeChunkIndex: 0, typedText: '' });
  res.json({ success: true, message: 'All progress has been reset.' });
});

// Serve frontend build if dist exists
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
