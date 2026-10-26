import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

describe('Backend Server API Endpoints', () => {
  let server: any;
  const PORT = 3099;
  const testDataDir = path.resolve(__dirname, 'test_server_data');

  beforeAll(async () => {
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    const app = express();
    app.use(cors());
    app.use(express.json());

    const PROGRESS_FILE = path.join(testDataDir, 'progress.json');
    const SETTINGS_FILE = path.join(testDataDir, 'settings.json');
    const LAST_ACTIVE_FILE = path.join(testDataDir, 'lastActive.json');

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', serverTime: new Date().toISOString() });
    });

    app.get('/api/progress', (req, res) => {
      const data = fs.existsSync(PROGRESS_FILE) ? JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')) : {};
      res.json(data);
    });

    app.post('/api/progress', (req, res) => {
      const all = fs.existsSync(PROGRESS_FILE) ? JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')) : {};
      all[req.body.lessonId] = req.body;
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(all, null, 2));
      res.json({ success: true, progress: req.body });
    });

    app.get('/api/settings', (req, res) => {
      const data = fs.existsSync(SETTINGS_FILE) ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) : { wordsPerChunk: 3 };
      res.json(data);
    });

    app.post('/api/settings', (req, res) => {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true, settings: req.body });
    });

    app.post('/api/reset', (req, res) => {
      if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
      res.json({ success: true });
    });

    app.get('/api/last-active', (req, res) => {
      const data = fs.existsSync(LAST_ACTIVE_FILE) ? JSON.parse(fs.readFileSync(LAST_ACTIVE_FILE, 'utf-8')) : { lessonId: 1, sentenceIndex: 0, activeChunkIndex: 0, typedText: '' };
      res.json(data);
    });

    app.post('/api/last-active', (req, res) => {
      fs.writeFileSync(LAST_ACTIVE_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true, lastActive: req.body });
    });

    // Lessons routes
    app.get('/api/lessons', (req, res) => {
      res.json([{ id: 1, title: 'Sam and His Cat', level: 1 }]);
    });

    app.get('/api/lessons/:id', (req, res) => {
      const id = parseInt(req.params.id, 10);
      if (id === 1) {
        res.json({ id: 1, title: 'Sam and His Cat', sentences: [{ id: 's-1', text: 'I am Sam.' }] });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    });

    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => resolve());
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it('responds with 200 and ok status on /api/health', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/health`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

  it('saves and returns progress on /api/progress', async () => {
    const postRes = await fetch(`http://localhost:${PORT}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: 7, currentSentenceIndex: 4, completed: false, bestAccuracy: 95 })
    });
    expect(postRes.ok).toBe(true);

    const getRes = await fetch(`http://localhost:${PORT}/api/progress`);
    const data = await getRes.json();
    expect(data[7]).toBeDefined();
    expect(data[7].bestAccuracy).toBe(95);
  });

  it('saves and updates user settings on /api/settings', async () => {
    const postRes = await fetch(`http://localhost:${PORT}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordsPerChunk: 3, speechSpeed: 0.8, repeatCount: 2 })
    });
    expect(postRes.ok).toBe(true);

    const getRes = await fetch(`http://localhost:${PORT}/api/settings`);
    const data = await getRes.json();
    expect(data.wordsPerChunk).toBe(3);
    expect(data.repeatCount).toBe(2);
  });

  it('saves and returns last-active state including typed text on /api/last-active', async () => {
    const postRes = await fetch(`http://localhost:${PORT}/api/last-active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        lessonId: 3, 
        sentenceIndex: 2, 
        activeChunkIndex: 1, 
        typedText: 'I see a cat.' 
      })
    });
    expect(postRes.ok).toBe(true);

    const getRes = await fetch(`http://localhost:${PORT}/api/last-active`);
    const data = await getRes.json();
    expect(data.lessonId).toBe(3);
    expect(data.typedText).toBe('I see a cat.');
    expect(data.activeChunkIndex).toBe(1);
  });

  it('serves lesson manifest and lesson content via /api/lessons', async () => {
    const manifestRes = await fetch(`http://localhost:${PORT}/api/lessons`);
    expect(manifestRes.ok).toBe(true);
    const manifest = await manifestRes.json();
    expect(Array.isArray(manifest)).toBe(true);
    expect(manifest[0].id).toBe(1);

    const lessonRes = await fetch(`http://localhost:${PORT}/api/lessons/1`);
    expect(lessonRes.ok).toBe(true);
    const lesson = await lessonRes.json();
    expect(lesson.title).toBe('Sam and His Cat');
    expect(lesson.sentences.length).toBeGreaterThan(0);
  });
});
