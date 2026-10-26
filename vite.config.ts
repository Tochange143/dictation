import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function serverApiPlugin(): Plugin {
  const dataDir = path.resolve(__dirname, 'server/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const readJson = (file: string, fallback: any) => {
    const p = path.join(dataDir, file);
    try {
      if (!fs.existsSync(p)) return fallback;
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch {
      return fallback;
    }
  };

  const writeJson = (file: string, data: any) => {
    const p = path.join(dataDir, file);
    try {
      fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch {
      return false;
    }
  };

  return {
    name: 'server-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api')) {
          return next();
        }

        const url = req.url.split('?')[0];

        res.setHeader('Content-Type', 'application/json');

        if (url === '/api/health') {
          res.end(JSON.stringify({ status: 'ok', serverTime: new Date().toISOString() }));
          return;
        }

        if (url === '/api/lessons') {
          const manifest = readJson('lessonsManifest.json', []);
          res.end(JSON.stringify(manifest));
          return;
        }

        const lessonMatch = url.match(/^\/api\/lessons\/(\d+)$/);
        if (lessonMatch) {
          const id = parseInt(lessonMatch[1], 10);
          const padded = String(id).padStart(3, '0');
          const lessonFile = path.join(dataDir, 'lessons', `lesson-${padded}.json`);
          if (fs.existsSync(lessonFile)) {
            try {
              const data = fs.readFileSync(lessonFile, 'utf-8');
              res.end(data);
              return;
            } catch {}
          }
          res.statusCode = 404;
          res.end(JSON.stringify({ error: `Lesson ${id} not found` }));
          return;
        }

        if (url === '/api/last-active') {
          if (req.method === 'GET') {
            const data = readJson('lastActive.json', { lessonId: 1, sentenceIndex: 0, activeChunkIndex: 0, typedText: '' });
            res.end(JSON.stringify(data));
            return;
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const lid = Number(parsed.lessonId) || 1;
                const state = {
                  lessonId: lid,
                  sentenceIndex: Number(parsed.sentenceIndex) || 0,
                  activeChunkIndex: Number(parsed.activeChunkIndex) || 0,
                  typedText: typeof parsed.typedText === 'string' ? parsed.typedText : '',
                  updatedAt: new Date().toISOString()
                };
                writeJson('lastActive.json', state);

                const allProgress = readJson('progress.json', {});
                allProgress[lid] = {
                  ...(allProgress[lid] || { lessonId: lid }),
                  sentenceIndex: state.sentenceIndex,
                  activeChunkIndex: state.activeChunkIndex,
                  typedText: state.typedText,
                  updatedAt: state.updatedAt
                };
                writeJson('progress.json', allProgress);

                res.end(JSON.stringify({ success: true, lastActive: state }));
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }

        if (url === '/api/progress') {
          if (req.method === 'GET') {
            const data = readJson('progress.json', {});
            res.end(JSON.stringify(data));
            return;
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                if (parsed && typeof parsed.lessonId === 'number') {
                  const all = readJson('progress.json', {});
                  all[parsed.lessonId] = {
                    ...(all[parsed.lessonId] || {}),
                    ...parsed,
                    updatedAt: new Date().toISOString()
                  };
                  writeJson('progress.json', all);
                  res.end(JSON.stringify({ success: true, progress: all[parsed.lessonId] }));
                } else {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Missing lessonId' }));
                }
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }

        if (url === '/api/settings') {
          if (req.method === 'GET') {
            const defaultSettings = {
              speechSpeed: 0.8,
              speechPitch: 1.0,
              selectedVoiceURI: null,
              repeatCount: 1,
              wordsPerChunk: 3,
              dictationPauseMs: 2500,
              autoAdvanceOnCorrect: true,
              autoAdvanceDelayMs: 1000,
              soundEffects: true
            };
            const data = readJson('settings.json', defaultSettings);
            res.end(JSON.stringify({ ...defaultSettings, ...data }));
            return;
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const curr = readJson('settings.json', {});
                const updated = { ...curr, ...parsed, updatedAt: new Date().toISOString() };
                writeJson('settings.json', updated);
                res.end(JSON.stringify({ success: true, settings: updated }));
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }

        if (url === '/api/reset' && req.method === 'POST') {
          writeJson('progress.json', {});
          writeJson('lastActive.json', { lessonId: 1, sentenceIndex: 0, activeChunkIndex: 0, typedText: '' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), serverApiPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
