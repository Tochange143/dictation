import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { 
  lessonsDao, 
  progressDao, 
  lastActiveDao, 
  settingsDao 
} from './server/db.js';

function serverApiPlugin(): Plugin {
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
          res.end(JSON.stringify({ status: 'ok', database: 'sqlite', serverTime: new Date().toISOString() }));
          return;
        }

        if (url === '/api/lessons') {
          const manifest = lessonsDao.getAll();
          res.end(JSON.stringify(manifest));
          return;
        }

        const lessonMatch = url.match(/^\/api\/lessons\/(\d+)$/);
        if (lessonMatch) {
          const id = parseInt(lessonMatch[1], 10);
          const lesson = lessonsDao.getById(id);
          if (lesson) {
            res.end(JSON.stringify(lesson));
            return;
          }
          res.statusCode = 404;
          res.end(JSON.stringify({ error: `Lesson ${id} not found` }));
          return;
        }

        const storyMatch = url.match(/^\/api\/story\/(\d+)$/);
        if (storyMatch) {
          const id = parseInt(storyMatch[1], 10);
          if (req.method === 'GET') {
            const p = progressDao.getById(id);
            res.end(JSON.stringify({
              lessonId: id,
              typedText: p ? p.typedText : '',
              activeChunkIndex: p ? p.activeChunkIndex : 0
            }));
            return;
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                progressDao.saveStory(id, parsed.typedText || '', parsed.activeChunkIndex || 0);
                lastActiveDao.save({
                  lessonId: id,
                  sentenceIndex: 0,
                  activeChunkIndex: parsed.activeChunkIndex || 0,
                  typedText: parsed.typedText || ''
                });
                res.end(JSON.stringify({ success: true, lessonId: id }));
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }

        const progressMatch = url.match(/^\/api\/progress\/(\d+)$/);
        if (progressMatch) {
          const id = parseInt(progressMatch[1], 10);
          const p = progressDao.getById(id);
          res.end(JSON.stringify(p || { lessonId: id, currentSentenceIndex: 0, activeChunkIndex: 0, typedText: '', completed: false }));
          return;
        }

        if (url === '/api/progress') {
          if (req.method === 'GET') {
            const all = progressDao.getAll();
            res.end(JSON.stringify(all));
            return;
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                if (parsed && typeof parsed.lessonId === 'number') {
                  progressDao.save(parsed);
                  const updated = progressDao.getById(parsed.lessonId);
                  res.end(JSON.stringify({ success: true, progress: updated }));
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

        if (url === '/api/last-active') {
          if (req.method === 'GET') {
            const data = lastActiveDao.get();
            res.end(JSON.stringify(data));
            return;
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                lastActiveDao.save(parsed);
                const updated = lastActiveDao.get();
                res.end(JSON.stringify({ success: true, lastActive: updated }));
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
            const settings = settingsDao.get();
            res.end(JSON.stringify(settings));
            return;
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const updated = settingsDao.save(parsed);
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
          progressDao.resetAll();
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
  base: './',
  plugins: [react(), serverApiPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
