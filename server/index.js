import express from 'express';
import cors from 'cors';
import { 
  lessonsDao, 
  progressDao, 
  lastActiveDao, 
  settingsDao 
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'sqlite', serverTime: new Date().toISOString() });
});

// Lessons Endpoints (Served directly from SQLite)
app.get('/api/lessons', (req, res) => {
  try {
    const list = lessonsDao.getAll();
    res.json(list);
  } catch (err) {
    console.error('Error fetching lessons:', err);
    res.status(500).json({ error: 'Failed to retrieve lessons' });
  }
});

app.get('/api/lessons/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1 || id > 100) {
    return res.status(404).json({ error: 'Lesson not found' });
  }
  try {
    const lesson = lessonsDao.getById(id);
    if (!lesson) {
      return res.status(404).json({ error: `Lesson ${id} not found in database` });
    }
    res.json(lesson);
  } catch (err) {
    console.error(`Error fetching lesson ${id}:`, err);
    res.status(500).json({ error: `Failed to retrieve lesson ${id}` });
  }
});

// Progress Endpoints (SQLite single source of truth)
app.get('/api/progress', (req, res) => {
  try {
    const all = progressDao.getAll();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

app.get('/api/progress/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid lesson ID' });
  try {
    const p = progressDao.getById(id);
    res.json(p || { lessonId: id, currentSentenceIndex: 0, activeChunkIndex: 0, typedText: '', completed: false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lesson progress' });
  }
});

app.post('/api/progress', (req, res) => {
  const p = req.body;
  if (!p || typeof p.lessonId !== 'number') {
    return res.status(400).json({ error: 'Invalid progress data: lessonId is required' });
  }
  try {
    progressDao.save(p);
    const updated = progressDao.getById(p.lessonId);
    res.json({ success: true, progress: updated });
  } catch (err) {
    console.error('Error saving progress:', err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Typed Story Endpoints (per-lesson server synchronization)
app.get('/api/story/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid lesson ID' });
  try {
    const p = progressDao.getById(id);
    res.json({
      lessonId: id,
      typedText: p ? p.typedText : '',
      activeChunkIndex: p ? p.activeChunkIndex : 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

app.post('/api/story/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid lesson ID' });
  const { typedText, activeChunkIndex } = req.body;
  try {
    progressDao.saveStory(id, typedText || '', activeChunkIndex || 0);
    // Also update last_active position
    lastActiveDao.save({
      lessonId: id,
      sentenceIndex: 0,
      activeChunkIndex: activeChunkIndex || 0,
      typedText: typedText || ''
    });
    res.json({ success: true, lessonId: id });
  } catch (err) {
    console.error('Error saving story:', err);
    res.status(500).json({ error: 'Failed to save story' });
  }
});

// Settings Endpoints
app.get('/api/settings', (req, res) => {
  try {
    const settings = settingsDao.get();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const updated = settingsDao.save(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Last Active State Endpoints
app.get('/api/last-active', (req, res) => {
  try {
    const lastActive = lastActiveDao.get();
    res.json(lastActive);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch last active state' });
  }
});

app.post('/api/last-active', (req, res) => {
  try {
    lastActiveDao.save(req.body);
    const updated = lastActiveDao.get();
    res.json({ success: true, lastActive: updated });
  } catch (err) {
    console.error('Error saving last active state:', err);
    res.status(500).json({ error: 'Failed to save last active state' });
  }
});

// Reset All Progress Endpoint
app.post('/api/reset', (req, res) => {
  try {
    progressDao.resetAll();
    res.json({ success: true, message: 'All progress reset successfully in SQLite' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset progress' });
  }
});

app.listen(PORT, () => {
  console.log(`English Dictation Server running on http://localhost:${PORT} with SQLite backend`);
});
